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
  the `{ success, data }` response contract.
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

## Progressive Web App

- `/manifest.webmanifest` defines standalone installation and the generated
  app icons in `public/icons/`.
- The production-only client plugin registers `public/sw.js`. It precaches the
  manifest and logo/icons, then caches same-origin static assets. Navigation
  documents and `/api/` responses are never cached.
- Background music is loaded from
  `public/assets/music/japanese-music.mp3`. Add that asset to enable playback;
  playback is only started by an explicit user action.
