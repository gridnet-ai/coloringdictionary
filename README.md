# Coloring Dictionary

> A dictionary you can color. · Color • Learn • Grow

Marketing site for **Coloring Dictionary**, built on the **AIWEB** app framework (Vite + React + TypeScript + Firebase Hosting/Functions) with full **VCAP** and **SEO**.

**Live origin (planned):** [https://coloringdictionary.com](https://coloringdictionary.com)  
**Repo:** [https://github.com/gridnet-ai/coloringdictionary](https://github.com/gridnet-ai/coloringdictionary)

## Features

- Brand landing page from the website / discovery previews (teal + gold system)
- Flower entry pages: Coreopsis, Pink Carnation, White Clover
- SEO: canonical, Open Graph, Twitter, robots, sitemap, FAQPage + Organization JSON-LD
- Machine-readable brand & book: `/brand.json`, `/book.json`, `/llms.txt`, `/discovery.json`, `/json.ld`
- VCAP: Visibility / Citability / Actionability (`/mcp.json`) / Performability (`/openapi.json`)
- AIWEB HITS handoff: `/api/vcap/hit` → Firestore outbox → Big Search `registry/access`
- Firebase Analytics (web config for project `coloringdictionary`)

## Quick start

```bash
npm install
npm run dev
```

## Email (own Gmail SMTP — not Resend)

Same stack as ai-locating: **nodemailer → `smtp.gmail.com`**.

| Field | Value |
|-------|--------|
| From name | Color Dictionary |
| From / SMTP user | `hello@coloringdictionary.com` |
| Transport | Google Workspace / Gmail app password |

Set `functions/.env` (see `functions/.env.example`), especially `SMTP_PASS` (Google App Password for that mailbox). Aliases can be added on the Google account later.

Signup flow: store intent → confirm subscriber → notify `hello@…`.

## Deploy

```bash
# Hosting only
npm run deploy:hosting

# Hosting + Functions (signup mail + VCAP hits + IRL)
cd functions && npm install && cd ..
npm run deploy:all
```

Firebase project: `coloringdictionary` (see `.firebaserc`).

Optional HITS drain: set `REGISTRY_INGEST_API_KEY` in `functions/.env` / Functions params.

Details: [docs/VCAP_HANDOFF.md](docs/VCAP_HANDOFF.md)

## Brand

Working palette (Brand Guide v1):

| Token | Hex |
|-------|-----|
| Deep teal | `#00505A` |
| Night teal | `#082F35` |
| Warm cream | `#FFF5DB` |
| Coloring gold | `#FFC629` |
| Reading ink | `#202A2D` |

Brand guide PDF: `docs/coloring-dictionary-brand-guide.pdf` (if present).

## Stack

| Layer | Choice |
|-------|--------|
| App | Vite 8 + React 19 + React Router |
| Hosting | Firebase Hosting |
| API / IRL / HITS | Firebase Cloud Functions |
| Analytics | Firebase Analytics |
| Registry metrics | Big Search `POST /api/v1/registry/access` |
