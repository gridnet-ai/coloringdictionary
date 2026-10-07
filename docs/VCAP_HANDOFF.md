# VCAP + AIWEB tracking handoff — Coloring Dictionary

## What shipped on origin

| Letter | Surface | URL |
|--------|---------|-----|
| **V** Visibility | Marketing HTML + OG/Twitter + theme-color | `https://coloringdictionary.com/` |
| **C** Citability | Machine overview + brand/book + JSON-LD | `/llms.txt`, `/brand.json`, `/book.json`, `/json.ld` |
| **A** Actionability | Tool descriptors | `/mcp.json` |
| **P** Performability | OpenAPI | `/openapi.json` |

Also: `/discovery.json`, `/sitemap.xml`, `/robots.txt`, FAQPage schema, flower entry pages.

IRL entrypoint (Firebase Function): `/irl/coloring-dictionary` (+ `/llms.txt`, `/mcp.json`, `/openapi.json`, `/json.ld` redirects).

## Tracking contract (Big Search HITS)

```http
POST https://bigsearchai.com/api/v1/registry/access
Content-Type: application/json
x-api-key: <REGISTRY_INGEST_API_KEY>

{
  "sourceRegistry": "coloringdictionary",
  "slug": "coloring-dictionary",
  "surface": "origin_html|origin_llms|irl_html|signup_intent|…",
  "httpStatus": 200,
  "path": "/",
  "userAgent": "…"
}
```

Metrics slug Big Search will derive: `coloringdictionary_coloring-dictionary`.

### Browser → Functions → Big Search

1. Client calls `recordVcapHit()` → `POST /api/vcap/hit` (no API key in the browser).
2. `api` Function writes Firestore `registryAccessOutbox`.
3. Scheduled `drainRegistryAccessOutbox` POSTs to Big Search with `REGISTRY_INGEST_API_KEY`.

### Ops checklist

1. Allowlist `sourceRegistry=coloringdictionary` on Big Search.
2. Set Firebase secret: `firebase functions:secrets:set REGISTRY_INGEST_API_KEY`
3. Enable Firestore in project `coloringdictionary`.
4. Deploy functions: `npm run deploy:functions`
5. Confirm drains in Functions logs / Big Search registry metrics.

## Signup

`POST /api/signup` stores email intents in `signupIntents` and records a `signup_intent` hit. Connect an ESP when launch email is ready.
