# ICHIGO | UTBK Study Journal

The application uses Nuxt 4, Vue 3 Single File Components, and Google Sheets
through the existing Google Apps Script Web App in `Code.gs`.

## Development

- Node.js 20.19 or newer
- Set `APPS_SCRIPT_URL` in the local server environment (do not commit it).
- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run build`

`APPS_SCRIPT_URL` is used only by the Nuxt server runtime. It is not part of
`runtimeConfig.public` and is never sent to the browser. Production deployments
must provide the variable to the server process.

## Data flow

- `GET /api/app-data` reads settings, applications, tryouts, study sessions,
  activity types, and schedule entries using their existing `Code.gs` actions.
- `POST /api/apps-script` proxies only the existing write actions from
  `Code.gs`.
- `server/utils/apps-script.js` centralizes Apps Script requests and validates
  the `{ success, data }` response contract. Requests time out after 20 seconds
  so a stalled Apps Script call produces an actionable error.
- `GET /api/notes` applies search, category/subtest filters, sorting, and
  numbered pagination in Apps Script; note detail and mutations use the same
  server-only Apps Script proxy.
- Note writes use the Apps Script contract `{ action: "saveNote", data: {...} }`.
  The rich-text `content` stays JSON and `subtests` stays an array.
- Write actions include a UUID `request_id`. Apps Script serializes writes with
  `LockService` and stores request fingerprints and completed IDs in the
  `_request_ledger` sheet, which is created automatically on the first write.
  Reusing an ID with a different action or payload is rejected; retries with
  the same payload reuse the original ID. Keep the ledger sheet and its row-4
  headers intact.
- `app/composables/useApp.js` maps database fields and relations for the UI.
- `app/plugins/state.client.js` loads database data; browser storage is not a
  source of application data.

## Application structure

- `app/pages/`: dashboard, scores, agenda, schedule, data, settings, and forms
- `app/components/`: reusable Vue layout, modal, and empty/loading-state components
- `app/composables/useApp.js`: shared state, database loading, and mutations
- `server/api/`: Nuxt endpoints for database reads and writes
- `server/utils/apps-script.js`: server-only Apps Script client
- `app/utils/`: supported subtest codes and date helpers
- `app/assets/css/main.css`: Tailwind theme and global styles

## Memori Kesalahan

Create the `notes` and `note_subtests` sheets in the connected spreadsheet if
they are not already present. Keep the existing records; do not clear either
sheet. `setupCheck()` validates required sheets but does not create them.
Headers belong in row 4 and records start at row 5.

| Sheet | Row 4 headers, in order |
| --- | --- |
| `notes` | `note_id`, `note_date`, `category`, `content`, `tryout_id`, `created_at`, `updated_at` |
| `note_subtests` | `note_subtest_id`, `note_id`, `subtest_code`, `created_at` |

After updating `Code.gs`, deploy a new version of the Apps Script Web App so
the idempotency ledger and request-ID validation are active. Keep its URL in
the server-only `APPS_SCRIPT_URL` environment variable; no new Vercel variable
is required.

## Try Out score report

The Data page exports the currently filtered Try Out records as an A4 PDF.
The report is generated in the browser on demand with dynamically imported
jsPDF and AutoTable; it uses data already loaded through the Nuxt API and does
not expose the Apps Script URL. Empty and invalid scores are excluded from
statistics rather than counted as zero.

## Progressive Web App

- `/manifest.webmanifest` defines standalone installation and the generated
  app icons in `public/icons/`.
- The production-only client plugin registers `public/sw.js`. It precaches the
  manifest and logo/icons, then caches same-origin static assets. Navigation
  documents and `/api/` responses are never cached.
- Background music is loaded from
  `public/assets/music/japanese-music.mp3`. Add that asset to enable playback;
  playback is only started by an explicit user action.
