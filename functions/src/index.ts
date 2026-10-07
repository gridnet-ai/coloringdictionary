import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';

initializeApp();

const db = getFirestore();
const registryApiKey = defineSecret('REGISTRY_INGEST_API_KEY');

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://coloringdictionary.com';
const SOURCE_REGISTRY = process.env.SOURCE_REGISTRY || 'coloringdictionary';
const IRL_SLUG = process.env.IRL_SLUG || 'coloring-dictionary';
const REGISTRY_ACCESS_URL =
  process.env.REGISTRY_ACCESS_URL ||
  'https://bigsearchai.com/api/v1/registry/access';

type AccessPayload = {
  sourceRegistry: string;
  slug: string;
  surface: string;
  httpStatus?: number;
  path: string;
  userAgent?: string;
  meta?: Record<string, string>;
};

function cors(res: { set: (k: string, v: string) => void }) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

async function enqueueHit(payload: AccessPayload) {
  await db.collection('registryAccessOutbox').add({
    ...payload,
    httpStatus: payload.httpStatus ?? 200,
    createdAt: FieldValue.serverTimestamp(),
    attempts: 0,
    status: 'pending',
  });
}

/** Unified API: /api/signup and /api/vcap/hit via Hosting rewrite. */
export const api = onRequest(
  { secrets: [registryApiKey], cors: true },
  async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    const path = (req.path || '').replace(/^\/api/, '') || req.url.replace(/^\/api/, '');

    if (path.startsWith('/signup') && req.method === 'POST') {
      const email = String(req.body?.email || '').trim();
      const consent = Boolean(req.body?.consent);
      if (!email || !consent) {
        res.status(400).json({ error: 'email and consent required' });
        return;
      }
      // Soft-open: store intent; wire ESP later
      await db.collection('signupIntents').add({
        email,
        source: req.body?.source || 'website',
        consent,
        createdAt: FieldValue.serverTimestamp(),
      });
      await enqueueHit({
        sourceRegistry: SOURCE_REGISTRY,
        slug: IRL_SLUG,
        surface: 'signup_intent',
        path: '/api/signup',
        userAgent: req.get('user-agent') || undefined,
      });
      res.status(200).json({ ok: true, message: 'You’re on the list.' });
      return;
    }

    if (path.startsWith('/vcap/hit') && req.method === 'POST') {
      const body = req.body as AccessPayload;
      if (!body?.surface || !body?.path) {
        res.status(400).json({ error: 'surface and path required' });
        return;
      }
      await enqueueHit({
        sourceRegistry: body.sourceRegistry || SOURCE_REGISTRY,
        slug: body.slug || IRL_SLUG,
        surface: body.surface,
        httpStatus: body.httpStatus ?? 200,
        path: body.path,
        userAgent: body.userAgent || req.get('user-agent') || undefined,
        meta: body.meta,
      });
      res.status(202).json({ ok: true, queued: true });
      return;
    }

    res.status(404).json({ error: 'not found' });
  },
);

/** Origin IRL VCAP HTML surface (Visibility) + citability links. */
export const irlVcap = onRequest(async (req, res) => {
  const ua = req.get('user-agent') || '';
  const path = req.path || '/irl/coloring-dictionary';

  void enqueueHit({
    sourceRegistry: SOURCE_REGISTRY,
    slug: IRL_SLUG,
    surface: path.includes('llms')
      ? 'irl_llms'
      : path.includes('mcp')
        ? 'irl_mcp'
        : path.includes('openapi')
          ? 'irl_openapi'
          : path.includes('json.ld')
            ? 'irl_jsonld'
            : 'irl_html',
    path,
    userAgent: ua,
  }).catch(() => undefined);

  if (path.endsWith('/llms.txt')) {
    res.redirect(302, `${SITE_ORIGIN}/llms.txt`);
    return;
  }
  if (path.endsWith('/mcp.json')) {
    res.redirect(302, `${SITE_ORIGIN}/mcp.json`);
    return;
  }
  if (path.endsWith('/openapi.json')) {
    res.redirect(302, `${SITE_ORIGIN}/openapi.json`);
    return;
  }
  if (path.endsWith('/json.ld')) {
    res.redirect(302, `${SITE_ORIGIN}/json.ld`);
    return;
  }

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Coloring Dictionary — AIWEB IRL</title>
  <meta name="description" content="A dictionary you can color. Flower Meanings Volume One preview." />
  <link rel="canonical" href="${SITE_ORIGIN}/" />
  <link rel="alternate" type="text/plain" href="${SITE_ORIGIN}/llms.txt" />
  <link rel="alternate" type="application/json" href="${SITE_ORIGIN}/brand.json" />
  <link rel="alternate" type="application/json" href="${SITE_ORIGIN}/book.json" />
  <meta http-equiv="refresh" content="0;url=${SITE_ORIGIN}/" />
</head>
<body>
  <h1>Coloring Dictionary</h1>
  <p>A dictionary you can color.</p>
  <ul>
    <li><a href="${SITE_ORIGIN}/">Website</a></li>
    <li><a href="${SITE_ORIGIN}/llms.txt">llms.txt</a></li>
    <li><a href="${SITE_ORIGIN}/brand.json">brand.json</a></li>
    <li><a href="${SITE_ORIGIN}/book.json">book.json</a></li>
    <li><a href="${SITE_ORIGIN}/mcp.json">mcp.json</a></li>
    <li><a href="${SITE_ORIGIN}/openapi.json">openapi.json</a></li>
  </ul>
</body>
</html>`);
});

/** Drain registry access outbox → Big Search (AIWEB HITS). */
export const drainRegistryAccessOutbox = onSchedule(
  {
    schedule: 'every 5 minutes',
    secrets: [registryApiKey],
  },
  async () => {
    const key = registryApiKey.value();
    if (!key) return;

    const snap = await db
      .collection('registryAccessOutbox')
      .where('status', '==', 'pending')
      .limit(50)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data() as AccessPayload & { attempts?: number };
      try {
        const response = await fetch(REGISTRY_ACCESS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
          },
          body: JSON.stringify({
            sourceRegistry: data.sourceRegistry,
            slug: data.slug,
            surface: data.surface,
            httpStatus: data.httpStatus ?? 200,
            path: data.path,
            userAgent: data.userAgent,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await doc.ref.update({
          status: 'sent',
          sentAt: FieldValue.serverTimestamp(),
        });
      } catch (err) {
        await doc.ref.update({
          attempts: (data.attempts || 0) + 1,
          lastError: String(err),
          status: (data.attempts || 0) + 1 >= 8 ? 'failed' : 'pending',
        });
      }
    }
  },
);
