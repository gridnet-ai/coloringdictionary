# Owner workspace

Routes: `/login` · `/owner`

Login UI matches the ChatGPT-style modal from **ai-locating** (domain chips, Google + email steps), branded for Coloring Dictionary.

## Auth

1. Enable **Email/Password** and **Google** in Firebase Authentication for project `coloringdictionary`.
2. Set `VITE_OWNER_EMAILS` (comma-separated) in `.env`.
3. First successful sign-in for an allowlisted email creates `staff/{uid}` with role `owner`.
4. Firestore rules enforce staff roles for editorial data; finance is owner-only.

## Milestone 1 flows

1. Browse imported flowers (745) with provenance.
2. Open Volume One / Texas / Christmas production boards.
3. Review registered assets (local vs Drive external).
4. CRM contacts & opportunities (localStorage until Firestore sync).
5. Sample export checks for spread readiness.
6. Optional: `POST /api/owner/seed` after setting `OWNER_SEED_TOKEN` in Functions.

## Integrations (labeled)

| Integration | Status |
|-------------|--------|
| Microsoft Clarity (`yu20t0k9dh`) | Connected |
| Gmail SMTP (`hello@…`) | Configured in Functions |
| Firebase Analytics | Connected when measurement ID present |
| AIWEB / VCAP HITS | Connected (outbox drain needs registry key) |
| Open English Wordnet import | Pending |
| KDP API | None — manual upload |
| Build a Coloring Dictionary consumer | Later phase |

## Reimport

```bash
python scripts/import_workbooks.py path/to/terry-list.xlsx path/to/production-tracker.xlsx
```

Writes `data/seed` and `public/data/seed`. Reimport must not overwrite `editorialLocked` fields when seeding Firestore.
