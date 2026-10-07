import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { sendLaunchSignupEmails } from './signupEmail';
import { SITE_ORIGIN as MAIL_SITE_ORIGIN } from './smtp';
import { seedFromPublicHosting } from './seed';
import {
  fetchUrlToGcs,
  importDwylWordListFromGcs,
  importKaikkiBatchFromGcs,
  importWebstersFromGcs,
  importWordnetBatchFromGcs,
  registerDictionarySources,
} from './dictionaryImport';
import {
  importFloriographyFromGcs,
  upsertFloriographyDictionaryEntry,
} from './floriographyImport';

initializeApp();

const db = getFirestore();
const registryApiKey = defineString('REGISTRY_INGEST_API_KEY', { default: '' });

const SITE_ORIGIN = process.env.SITE_ORIGIN || MAIL_SITE_ORIGIN;
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
  const doc: Record<string, unknown> = {
    sourceRegistry: payload.sourceRegistry,
    slug: payload.slug,
    surface: payload.surface,
    httpStatus: payload.httpStatus ?? 200,
    path: payload.path,
    createdAt: FieldValue.serverTimestamp(),
    attempts: 0,
    status: 'pending',
  };
  if (payload.userAgent) doc.userAgent = payload.userAgent;
  if (payload.meta) doc.meta = payload.meta;
  await db.collection('registryAccessOutbox').add(doc);
}

/** Unified API: /api/signup and /api/vcap/hit via Hosting rewrite. */
export const api = onRequest(
  { cors: true, memory: '1GiB', timeoutSeconds: 540 },
  async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const path =
    (req.path || '').replace(/^\/api/, '') || req.url.replace(/^\/api/, '');

  if (path.startsWith('/signup') && req.method === 'POST') {
    const email = String(req.body?.email || '').trim();
    const consent = Boolean(req.body?.consent);
    if (!email || !consent) {
      res.status(400).json({ error: 'email and consent required' });
      return;
    }

    const source = String(req.body?.source || 'website');
    await db.collection('signupIntents').add({
      email: email.toLowerCase(),
      source,
      consent,
      createdAt: FieldValue.serverTimestamp(),
    });

    try {
      await sendLaunchSignupEmails({ email, source });
    } catch (err) {
      logger.error('Signup email failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

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

  /**
   * Import TerryList flower meanings into the floriography Firestore database.
   * POST /api/owner/floriography/import { token, maxEntries?, force? }
   */
  if (path.startsWith('/owner/floriography/import') && req.method === 'POST') {
    const expected = String(process.env.OWNER_SEED_TOKEN || '').trim();
    const provided = String(req.body?.token || req.get('x-owner-seed-token') || '').trim();
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      const result = await importFloriographyFromGcs({
        maxEntries:
          typeof req.body?.maxEntries === 'number' ? req.body.maxEntries : undefined,
        force: Boolean(req.body?.force),
      });
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      logger.error('Floriography import failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : 'import failed',
      });
    }
    return;
  }

  /**
   * Upsert Floriography definition into the dictionary (default) database.
   * POST /api/owner/dictionary/floriography-entry { token }
   */
  if (path.startsWith('/owner/dictionary/floriography-entry') && req.method === 'POST') {
    const expected = String(process.env.OWNER_SEED_TOKEN || '').trim();
    const provided = String(req.body?.token || req.get('x-owner-seed-token') || '').trim();
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      const result = await upsertFloriographyDictionaryEntry();
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'upsert failed',
      });
    }
    return;
  }

  /** Register dictionary source objects in Firestore (GCS paths). */
  if (path.startsWith('/owner/dictionary/register') && req.method === 'POST') {
    const expected = String(process.env.OWNER_SEED_TOKEN || '').trim();
    const provided = String(req.body?.token || req.get('x-owner-seed-token') || '').trim();
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      const result = await registerDictionarySources();
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'register failed',
      });
    }
    return;
  }

  /**
   * Fetch a remote corpus URL straight into GCS (no laptop disk).
   * POST /api/owner/dictionary/fetch { token, url, objectPath }
   */
  if (path.startsWith('/owner/dictionary/fetch') && req.method === 'POST') {
    const expected = String(process.env.OWNER_SEED_TOKEN || '').trim();
    const provided = String(req.body?.token || req.get('x-owner-seed-token') || '').trim();
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const url = String(req.body?.url || '').trim();
    const objectPath = String(req.body?.objectPath || '').trim();
    if (!url || !objectPath) {
      res.status(400).json({ error: 'url and objectPath required' });
      return;
    }
    try {
      const result = await fetchUrlToGcs({ url, objectPath });
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      logger.error('GCS fetch failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : 'fetch failed',
      });
    }
    return;
  }

  /**
   * Import Webster's Unabridged (year-stamped editions) from GCS.
   * POST /api/owner/dictionary/import-websters
   * { token, maxEntries?, letterPrefix?, asOfYear? }
   */
  if (path.startsWith('/owner/dictionary/import-websters') && req.method === 'POST') {
    const expected = String(process.env.OWNER_SEED_TOKEN || '').trim();
    const provided = String(req.body?.token || req.get('x-owner-seed-token') || '').trim();
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      const result = await importWebstersFromGcs({
        objectPath: req.body?.objectPath
          ? String(req.body.objectPath)
          : undefined,
        maxEntries:
          typeof req.body?.maxEntries === 'number' ? req.body.maxEntries : 3000,
        letterPrefix: req.body?.letterPrefix
          ? String(req.body.letterPrefix)
          : undefined,
        asOfYear:
          typeof req.body?.asOfYear === 'number' ? req.body.asOfYear : 1913,
      });
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      logger.error('Webster import failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : 'import failed',
      });
    }
    return;
  }

  /**
   * Import dwyl/english-words lemma list from GCS → dictionary Firestore.
   * POST /api/owner/dictionary/import-dwyl { token, maxEntries?, letterPrefix?, skipExisting? }
   */
  if (path.startsWith('/owner/dictionary/import-dwyl') && req.method === 'POST') {
    const expected = String(process.env.OWNER_SEED_TOKEN || '').trim();
    const provided = String(req.body?.token || req.get('x-owner-seed-token') || '').trim();
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      const result = await importDwylWordListFromGcs({
        objectPath: req.body?.objectPath
          ? String(req.body.objectPath)
          : undefined,
        maxEntries:
          typeof req.body?.maxEntries === 'number' ? req.body.maxEntries : 8000,
        letterPrefix: req.body?.letterPrefix
          ? String(req.body.letterPrefix)
          : undefined,
        skipExisting:
          typeof req.body?.skipExisting === 'boolean'
            ? req.body.skipExisting
            : true,
      });
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      logger.error('dwyl word list import failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : 'import failed',
      });
    }
    return;
  }

  /**
   * Import Open English Wordnet batch from GCS zip → Firestore.
   * POST /api/owner/dictionary/import-wordnet { token, maxEntries?, letterPrefix?, objectPath? }
   */
  if (path.startsWith('/owner/dictionary/import-wordnet') && req.method === 'POST') {
    const expected = String(process.env.OWNER_SEED_TOKEN || '').trim();
    const provided = String(req.body?.token || req.get('x-owner-seed-token') || '').trim();
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      const result = await importWordnetBatchFromGcs({
        objectPath: req.body?.objectPath
          ? String(req.body.objectPath)
          : undefined,
        maxEntries:
          typeof req.body?.maxEntries === 'number' ? req.body.maxEntries : 300,
        letterPrefix: req.body?.letterPrefix
          ? String(req.body.letterPrefix)
          : 'a',
      });
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      logger.error('Wordnet import failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : 'import failed',
      });
    }
    return;
  }

  /**
   * Import a Kaikki batch from GCS → Firestore (no local disk).
   * POST /api/owner/dictionary/import-kaikki { token, maxEntries?, objectPath? }
   */
  if (path.startsWith('/owner/dictionary/import-kaikki') && req.method === 'POST') {
    const expected = String(process.env.OWNER_SEED_TOKEN || '').trim();
    const provided = String(req.body?.token || req.get('x-owner-seed-token') || '').trim();
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      const result = await importKaikkiBatchFromGcs({
        objectPath: req.body?.objectPath
          ? String(req.body.objectPath)
          : undefined,
        maxEntries:
          typeof req.body?.maxEntries === 'number' ? req.body.maxEntries : 500,
      });
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      logger.error('Kaikki import failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : 'import failed',
      });
    }
    return;
  }

  /** Owner seed: POST /api/owner/seed { token, force?, maxFlowers? } */
  if (path.startsWith('/owner/seed') && req.method === 'POST') {
    const expected = String(process.env.OWNER_SEED_TOKEN || '').trim();
    const provided = String(req.body?.token || req.get('x-owner-seed-token') || '').trim();
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      const result = await seedFromPublicHosting({
        force: Boolean(req.body?.force),
        maxFlowers:
          typeof req.body?.maxFlowers === 'number' ? req.body.maxFlowers : undefined,
      });
      res.status(200).json(result);
    } catch (err) {
      logger.error('Owner seed failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        error: err instanceof Error ? err.message : 'seed failed',
      });
    }
    return;
  }

  res.status(404).json({ error: 'not found' });
});

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
  { schedule: 'every 5 minutes' },
  async () => {
    const key = registryApiKey.value().trim();
    if (!key) {
      logger.info('REGISTRY_INGEST_API_KEY unset — skipping HITS drain');
      return;
    }

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
