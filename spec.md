# TakeFastNotes — Specification

A local-first SPA for capturing notes, ideas, features, fixes and decisions in seconds, then organizing them under a **hierarchy of containers** (a repo, a document, a client, a folder) with tags, types and status.

Everything is stored in the browser (IndexedDB). No backend, no accounts, no network calls. Deployed as a static build on Vercel's free tier — no server, no secrets.

## Quick path

1. Open the app → the nav bar has a **Quick Capture** input, always focused-ready.
2. Type a thought, press `Enter` → an `inbox` note is created instantly, tagged and typed by inline syntax.
3. Select a container in the sidebar → new captures land inside it.
4. Set status (`idea` → `planned` → `doing` → `done`), attach tags, link related notes.
5. Export JSON from Settings whenever you want a backup.

## Product principles

| Principle | Consequence |
|---|---|
| Capture before organization | Every note can be created with zero fields filled. Enrichment is optional, never required to save. |
| Context-free core | The app models *containers* and *notes*. "GitHub repo" is just a container with `kind=repo` and a URL. Nothing in the domain knows about GitHub. |
| Local-first, exportable | No backend means no sync. Therefore export/import is a first-class feature, not a nice-to-have. |
| Zero-network at runtime | The deployed app makes no requests after the initial asset load. No analytics, no fonts, no CDN, no API. Nothing to leak, and a strict CSP becomes possible. |
| Deployable anywhere | Static build + hash routing: no server config, no rewrite rules, no secrets. The same `dist/` works on Vercel, GitHub Pages or any static host. |
| Boring, legible data | Plain JSON documents, ISO-8601 timestamps, no binary blobs, no opaque encryption. |
| Fast keyboard-driven flow | A developer capturing notes wants keystrokes, not dialogs. |

## Scope

### In scope (v1)

- Quick capture from the nav bar, with inline `#tag`, `kind:` and `@container` syntax.
- Notes with: body, type, status, tags, optional container, optional links to other notes/containers.
- Containers forming a **tree** (nested via `parentId`), each with optional `kind` and `url`.
- Sidebar tree with containers, smart views (Inbox, Unclassified, All), tag list and status filters.
- Full-text search over title/body/tags (client-side, in-memory).
- Keyboard shortcuts.
- JSON export / import (full backup, and merge-safe import).
- Storage usage indicator.

### Out of scope (v1) — and why

| Not doing | Why |
|---|---|
| Real GitHub API integration (issues, PRs, commits) | OAuth token exchange requires a backend or storing a PAT in the browser. Both are bad tradeoffs for a local-first note tool. v1 links to the repo URL instead. |
| Multi-device sync / collaboration | Requires a backend and an identity model. Vercel Postgres/Blob are paid add-ons and would create a second home for the data. Out of scope for v1. |
| Vercel Functions / serverless | No server-side state exists, so a runtime would only add cold starts, secrets and attack surface. The app ships as static files. |
| Service worker / offline PWA (deferred to v1.1) | A precached shell must be invalidated on every deploy; stale-shell bugs cost more than the offline benefit. v1.1 adds it with an explicit `registerType: 'prompt'` update flow. |
| Rich text / WYSIWYG editor | Plain text + Markdown source is faster to write, easier to search, easier to export. |
| Attachments / images | Bloats IndexedDB and complicates export. Revisit only if needed. |
| Custom status workflows | A fixed status set keeps the UI fast and filters predictable. |
| Auth, telemetry, analytics | No backend, no data leaves the browser. |

## Domain model

Pure JavaScript. No React, no IndexedDB imports in this layer.

### Container

A thing a note can belong to. Generic on purpose.

| Field | Type | Rules |
|---|---|---|
| `id` | `string` (uuid) | Primary key. |
| `name` | `string` | Required, non-empty. Unique among siblings (case-insensitive). |
| `kind` | `string` | Free-form label. Suggestions: `repo`, `doc`, `folder`, `client`, `project`, `service`. Not an enum. |
| `url` | `string \| null` | Optional external link (e.g. GitHub repo URL). |
| `parentId` | `string \| null` | `null` = root level. Enables the hierarchy. |
| `archived` | `boolean` | Archived containers are hidden but keep their notes. |
| `createdAt` | `string` | ISO-8601. |
| `updatedAt` | `string` | ISO-8601. |

Invariants:
- No cycles: a container's `parentId` may not be itself or one of its descendants.
- Deleting a container reparents its children to the deleted container's parent (no cascade delete of notes).

### Note

The atomic unit of capture.

| Field | Type | Rules |
|---|---|---|
| `id` | `string` (uuid) | Primary key. |
| `title` | `string` | Optional. If empty, derived from the first non-empty body line (max 80 chars). |
| `body` | `string` | Markdown-ish plain text. May be empty only if `title` is set. |
| `kind` | `enum` | `note` \| `idea` \| `feature` \| `fix` \| `decision` \| `question`. Default `note`. |
| `status` | `enum` | `inbox` \| `backlog` \| `planned` \| `doing` \| `done` \| `dropped`. Default `inbox`. |
| `tags` | `string[]` | Lowercase, trimmed, de-duplicated. Free-form, no fixed vocabulary. |
| `containerId` | `string \| null` | `null` = unclassified. Must reference an existing container. |
| `pinned` | `boolean` | Pinned notes sort first. |
| `archived` | `boolean` | Hidden from default lists, recoverable. |
| `createdAt` | `string` | ISO-8601. |
| `updatedAt` | `string` | ISO-8601. |

Status semantics (fixed lifecycle):

| Status | Meaning |
|---|---|
| `inbox` | Just captured, not yet triaged. |
| `backlog` | Triaged, no commitment. |
| `planned` | Committed, not started. |
| `doing` | In progress. |
| `done` | Completed. |
| `dropped` | Deliberately discarded (kept for history). |

Kind semantics: `idea` is unvalidated thinking, `feature` is a proposed capability, `fix` is a correction/bug, `decision` is a choice made (with optional context), `question` is an open unknown.

### Link

An explicit relation between two entities.

| Field | Type | Rules |
|---|---|---|
| `id` | `string` (uuid) | Primary key. |
| `sourceType` | `'note' \| 'container'` | |
| `sourceId` | `string` | |
| `targetType` | `'note' \| 'container'` | |
| `targetId` | `string` | |
| `relation` | `string` | Default `relates-to`. Free-form suggestions: `blocks`, `blocked-by`, `duplicate-of`, `implements`, `caused-by`, `depends-on`, `refines`. |
| `createdAt` | `string` | ISO-8601. |

Invariants:
- No self-links (`sourceId !== targetId`).
- A link pair `(sourceType, sourceId, targetType, targetId, relation)` is unique.

Notes may also carry plain external URLs inside the body (Markdown links). Links are for *typed* relations to entities inside the app.

### Derived views (not stored)

- **Inbox** — notes with `status=inbox`.
- **Unclassified** — notes with `containerId=null`.
- **All notes**, **All containers**.
- **By tag**, **By status**, **By kind** — filters, combinable.
- **Descendant rollup** — a container's note count includes notes in descendant containers.

## Quick Capture

The nav bar hosts a single input. It is the primary entry point of the app.

### Behavior

1. `Enter` → create a note immediately. Never blocks on validation beyond "non-empty input".
2. `Shift+Enter` → newline inside the body.
3. `Esc` → clear the input (and collapse the expanded capture panel).
4. The capture inherits the **currently selected container** from the sidebar, unless the text contains `@container-name`.
5. After creation the input stays focused and empty, so multiple notes can be fired in a row.

### Inline syntax

Parsed left to right, then removed from the body:

| Syntax | Effect |
|---|---|
| `#tag` | Adds a tag (lowercased). Multiple allowed. Dots are allowed inside a tag (`#release/2.0`) but not at the end. |
| `note:` `idea:` `feature:` `fix:` `decision:` `question:` | Sets `kind`. Only recognized as a **prefix** of the input. |
| `@container` | Sets the container. Matches the **longest existing container name** that follows the `@`, case-insensitively, so names with spaces work (`@Architecture Docs`). If nothing matches, the token stays in the body — a container is never created implicitly. Only the first `@` token is considered. |

Example:

```
feature: add webhook retries #backend #gh-actions @TakeFastNotes
```
→ kind `feature`, tags `["backend","gh-actions"]`, container `TakeFastNotes`, title `add webhook retries`.

### Expanded capture

Clicking the capture area (or `Ctrl/Cmd+Enter`) expands a small panel with kind, status, tags and container. The quick path stays one keystroke; the expanded panel is opt-in.

## User interface

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ NAV   [Quick capture...............................] [⌘K search]│
├──────────────┬────────────────────────────────────────────────┤
│ SIDEBAR      │ MAIN                                            │
│ Inbox        │  breadcrumb / view title                       │
│ Unclassified │  ┌──────────────────────────────────────────┐  │
│ All notes    │  │ Note card: title, preview, badges, tags  │  │
│              │  └──────────────────────────────────────────┘  │
│ CONTAINERS   │  ┌──────────────────────────────────────────┐  │
│ ▸ repo-a     │  │ Note card                               │  │
│   ▸ sub-repo │  └──────────────────────────────────────────┘  │
│ ▸ docs       │                                                │
│              │                                                │
│ TAGS         │                                                │
│ #backend     │                                                │
└──────────────┴────────────────────────────────────────────────┘
```

### Sidebar

- Smart views: Inbox, Unclassified, All notes.
- Container tree: collapsible, shows note count per container, drag-and-drop target for moving notes.
- Tag list with counts. Clicking a tag filters the main pane.
- Status filter row (compact chips).

### Note card

- Title (bold) + first line preview (muted, clamped).
- `kind` badge, `status` badge, tag chips.
- Container breadcrumb chip (only when viewing a flat list).
- Hover actions: pin, archive, delete (soft delete → archived).

### Note editor

Opened as a side panel or a full view. Contains:

- Title input (single line).
- Body textarea (plain text, Markdown source).
- Kind selector, status selector, tag editor (chips + free text).
- Container picker (tree select).
- Links section: list of outgoing links, add-link control (note or container, with relation type).
- Metadata footer: created / updated timestamps, note id (copyable).

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl/Cmd + K` | Focus search. |
| `Ctrl/Cmd + Enter` | Expand quick capture. |
| `Enter` / `Shift+Enter` | Save / newline (in capture). |
| `Esc` | Close editor, clear capture. |
| `J` / `K` | Move selection in the list. |
| `Enter` (in list) | Open selected note. |
| `E` | Archive selected note. |
| `?` | Toggle shortcut help. |

### Search

Client-side, in-memory, over `title`, `body` and `tags`. Case-insensitive substring match, ranked by: title match > tag match > body match, then by `updatedAt` desc. No search index needed at this scale.

## Persistence

### IndexedDB schema

Database `takefastnotes`, version `1`.

| Store | Key path | Indexes |
|---|---|---|
| `notes` | `id` | `by_container` (`containerId`), `by_status` (`status`), `by_kind` (`kind`), `by_updated` (`updatedAt`), `by_pinned` (`pinned`), `by_tag` (`tags`, `multiEntry`) |
| `containers` | `id` | `by_parent` (`parentId`) |
| `links` | `id` | `by_source` (`[sourceType, sourceId]`), `by_target` (`[targetType, targetId]`) |
| `prefs` | `key` | — (`key`/`value` pairs: last selected container, theme, sidebar state) |

Timestamps are stored as **ISO-8601 strings**, not `Date` objects, so the raw DB stays human-readable and diff-friendly.

### Repository layer (ports & adapters)

The domain declares ports; IndexedDB implements them.

```js
// domain/ports/noteRepository.js
export const noteRepository = {
  all(), byId(id), byContainer(id), create(note), update(id, patch),
  remove(id), count(), bulkPut(notes)
}
```

Same shape for `containerRepository`, `linkRepository`, `prefsRepository`.

All writes go through a repository method that owns its transaction. Components never touch IndexedDB directly.

### Operational rules

- **One origin, one database.** IndexedDB is scoped per origin. `localhost:5173` and the deployed domain are *different* databases. The Settings screen shows the current origin so the user is never confused about where the data lives.
- **Write off the render path.** Persist inside the repository call, then update the store; never inside a `useEffect` that depends on the same state it mutates.
- **Storage quota.** Show `navigator.storage.estimate()` usage in Settings; warn below a threshold and on `QuotaExceededError`.
- **Incognito / cleared data.** IndexedDB can be wiped by the browser. The Settings screen shows the last export timestamp and a prominent Export button.
- **Schema migrations.** The DB version constant and a migration map live in one file; every schema change adds a migration function instead of editing the initial schema.

## Deployment

Target: **Vercel Hobby (free)**, published at `https://takefastnotes.vercel.app`. Vercel Authentication is **off** for this project: the app holds no data on the server, so the URL is public and the notes stay in the browser that opens it. The app is a static bundle served from Vercel's CDN. No server, no functions, no database, no environment variables, no secrets.

### Decisions

| Decision | Why |
|---|---|
| Static build only (`dist/`), zero serverless functions | No runtime, no cold starts, no function quota consumed, near-zero attack surface. Also makes the build portable to any static host. |
| Hash routing (`/#/notes`) instead of history routing | No `rewrites` rule needed, so the same build works on Vercel, GitHub Pages, Netlify or a subpath. The fragment never reaches the server. Tradeoff: uglier URLs and no SEO (irrelevant for a personal tool). |
| `vercel.json` committed to the repo | Build command, output directory and security headers are versioned, so a deploy is reproducible. |
| Git integration, `main` → Production | Every push deploys. Hobby allows 100 deployments/day, far above what a personal project needs. |
| Preview deployments are throwaway | Each preview URL is a **different origin → a different IndexedDB**. Previews are for UI checks; real usage happens on the production domain. |
| No secrets in the build | `VITE_*` variables are inlined into the public bundle. The app needs none — do not introduce any. |
| `npm ci` with a committed lockfile | Deterministic builds; `package-lock.json` must be committed. |

### Configuration

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "no-referrer" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        { "key": "X-Robots-Tag", "value": "noindex, nofollow" }
      ]
    }
  ]
}
```

`package.json` (relevant fields):

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "engines": { "node": "24.x" }
}
```

Pin the same Node version locally (`.nvmrc`) so local and remote builds match.

### The domain IS the database key

IndexedDB is scoped per origin. `https://notes.vercel.app` and `https://notes.example.com` are **different databases**.

- The Vercel project name becomes part of the permanent URL and therefore part of the data's identity. **Rename the project only before real usage.**
- Changing the domain does not migrate data. Recovery path: Export → Import.
- A `*.vercel.app` subdomain is stable as long as the project name doesn't change; a purchased custom domain is more stable still.
- The Settings screen shows the current origin and where the data lives, so this is never a surprise.

### Deploy flow

1. `git init` and commit — the directory is not yet a git repository.
2. Push to GitHub under a **personal** account (Hobby cannot connect organization-owned repositories).
3. Vercel dashboard → import the repo → Framework Preset **Vite** → deploy.
4. Verify: build output is `dist`; headers present (`curl -I https://<app>.vercel.app`); app loads; notes survive a reload.
5. Optionally enable **Vercel Authentication** (available on Hobby, "only you can access deployments") for a private URL — at the cost of a Vercel login on every visit.

### Hobby limits (verified against Vercel docs, 2026-10-20)

| Limit | Hobby value | This app's usage |
|---|---|---|
| Deployments per day | 100 | ~1/day |
| Build time per deployment | 45 min max | ~15 s |
| Fast data transfer | 100 GB/month | a few MB/month |
| Projects | 200 | 1 |
| Domains per project | 50 | 1 |
| Runtime logs | 1 hour | n/a (no functions) |
| Static upload via CLI | 100 MB / 15,000 files | n/a (git deploy) |

## Security

Threat model: the app holds personal notes in the browser and never sends them anywhere.

| Concern | Decision |
|---|---|
| Data exfiltration | The app makes zero network requests after load. CSP sets `connect-src 'none'`, so even a bug cannot phone home. |
| XSS | No HTML rendering in v1: bodies render as text, never as HTML. `dangerouslySetInnerHTML` is banned. Strict CSP (`script-src 'self'`, `object-src 'none'`, `base-uri 'none'`) is the second layer. |
| Third-party scripts | None — no analytics, no error tracking, no fonts, no CDN. Every byte comes from the same origin. This is also what makes the strict CSP possible. |
| Untrusted import | Import validates the file shape, whitelists fields (never spreads arbitrary keys), rejects `__proto__` / `constructor` keys, and caps the file size (20 MB) before parsing. |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY`. |
| Referrer leakage | `Referrer-Policy: no-referrer`. |
| Device permissions | `Permissions-Policy` disables camera, microphone and geolocation; the app needs none. |
| Search indexing | `X-Robots-Tag: noindex, nofollow`. |
| Hosting access | Vercel Authentication (Hobby) can restrict the deployment to the account owner. |
| Secrets | None exist. `VITE_*` values are public — never put a token there. |

Note: enabling Vercel Web Analytics or the Vercel Toolbar injects third-party scripts and requires relaxing the CSP. Decision: both stay disabled.

The **dev** server relaxes the policy in three places, all caused by the tooling and not by the app: `script-src` and `style-src` allow `'unsafe-inline'` (Vite injects an inline preamble and `<style>` tags at runtime for React Fast Refresh and CSS HMR) and `connect-src` allows `ws:`/`wss:` for the HMR socket. The application code itself is held to the strict rule and verified by grep; the production build is verified against the strict policy in a real browser.

## Typography assets

Both typefaces are **self-hosted and vendored** in `src/styles/fonts/` as latin-subset `woff2` files, declared with `@font-face` in `src/styles/fonts.css`. The `@fontsource-variable/*` packages are kept as **dev** dependencies only: they are the provenance of those files, not a runtime dependency. The build ships exactly two font files, same-origin, with no external request.

## Views and routing

Routing is **hash based** (`#/notas`, `#/acerca`): the fragment never reaches the server, so the same build works on any static host without a rewrite rule, and a view can be linked or reached with the back button.

| Route | View | Purpose |
|---|---|---|
| `#/notas` | `InboxView` | The register: the note list with inbox/all/archived scopes, inline editing, archiving and links. |
| `#/contenedores` | `ContainersView` | The contexts a note can be filed under: tree, create, delete. |
| `#/nota/<id>` | `NoteView` | One note as a document: content, context, and the notes that point at it. |
| `#/acerca` | `AboutView` | What the app is, how it is used, and the data policy. |

The **shell** owns the frame: a sticky header with the identity, the search field (`Ctrl/Cmd+K`), the section links and the capture bar, then a two-column body — a **sidebar with the container tree** on the left and the register on the right. The sidebar is the navigation spine: selecting a node filters the list to that container *and its descendants*, so the number the tree shows and the list underneath always agree. On narrow screens the sidebar collapses behind a toggle.

The containers page shows the same tree in its management form. The two never appear at once: on that route the sidebar steps aside, because the same names twice on one screen is noise, not navigation.

**Finding notes.** Three filters stack, and the counts always agree with what they filter: the **search field** (`Ctrl/Cmd+K`) matches title, body and tags and ranks title matches first; the **filter bar** narrows by type and by tag, and several selections combine (types as *any of*, tags as *all of*); the **container tree** narrows to a container and its descendants. A note reached from a link opens on `#/nota/<id>`, as a document with its own address — which also makes it linkable and shareable.

### The "Acerca de" section

The trust document. It answers the three questions a person asks before handing their notes to a tool, and it is not a wall of text: the data claims are **verified by the running app**.

| Block | Content |
|---|---|
| Qué es y para qué sirve | The objective, and what the app deliberately is not. |
| Cómo se usa | The capture grammar as a table, the status lifecycle, and what tags and containers are for. |
| Dónde están tus datos | Live facts: the current origin, the database name, the counts of this copy, the storage used against the quota, and when the last backup was taken. |
| Qué sale de tu dispositivo | Nothing: no network calls after load, no account, no analytics, no third party. |
| Cómo se pueden perder los datos | The six real ways this data can disappear, stated plainly. |
| Cómo protegerlos | The working **Descargar copia de seguridad** and **Restaurar desde un archivo** actions, plus the merge semantics of a restore. |
| Atajos de teclado | The shortcuts that actually exist. |

The backup actions are real, not decorative: export writes the whole database to a JSON file and records the timestamp in preferences; import validates the file field by field and merges it without deleting anything.

## Revisión ciega (Judgment Day)

Dos revisores adversarios ciegos, mismo target inmutable (`861b6d2a…`, commit `8a6a3ef`, 73 archivos, 10.179 líneas), un barrido de lectura por cada uno. Criterios: correctitud, casos borde, manejo de errores, performance, seguridad y convenciones del proyecto. Los dos Conservativemente no auto-corregimos nada: solo los hallazgos severos confirmados por ambos van a una ronda de corrección.

### Confirmados por ambos (2 severos + 6 advertencias)

| ID | Severidad | Hallazgo | Dónde |
|---|---|---|---|
| C1 | CRITICAL | Al borrar el contenedor seleccionado, `prefs.currentContainerId` queda apuntando a un contenedor que ya no existe: el registro muestra "Sin resultados" y las capturas siguientes se guardan con un `containerId` colgante. | `src/ui/state/appStore.jsx` |
| C2 | CRITICAL | Editar una nota cuyo `containerId` ya no existe descarta **toda** la edición: `moveNote` lanza antes del dispatch, el editor ya se cerró y el texto tipeado se pierde sin mensaje. | `src/ui/state/appStore.jsx`, `NoteRow.jsx`, `NoteView.jsx` |
| W1 | WARNING | `updateContainer` y `nestContainer` calculan un `updatedAt` nuevo en memoria pero escriben solo el patch: en la base queda el viejo. | `src/ui/state/appStore.jsx` |
| W2 | WARNING | Si la escritura de una nota falla, el store revierte en silencio y nadie ve el error (la captura sí lo reporta). | `src/ui/state/appStore.jsx`, `NoteRow.jsx` |
| W3 | WARNING | "Acerca de" afirma que los contenedores se muestran en una lista plana y que el árbol anidado es lo siguiente: es falso, el árbol ya existe. | `src/ui/views/AboutView.jsx` |
| W4 | WARNING | `pinned` es un campo muerto: nadie lo fija y el orden nunca lo tiene en cuenta. | `src/domain/usecases/search.js` |
| W5 | WARNING | No existe la vista "Sin contenedor", que el spec define como vista derivada. | `src/ui/views/InboxView.jsx` |
| W6 | WARNING | Faltan interacciones de captura del spec: `Esc` no limpia el campo, `Ctrl/Cmd+Enter` guarda en vez de expandir, y no existe el panel expandido. | `src/ui/components/QuickCapture.jsx` |

### Sospechosos (reportado por un solo juez — no se corrigen sin decisión)

| ID | Severidad | Hallazgo |
|---|---|---|
| S1 | WARNING | `removeContainer` desclasifica las notas de los descendientes **que sobreviven** al borrado (los hijos se reparentan, pero sus notas quedan sin contenedor). |
| S2 | WARNING | La importación no valida la integridad referencial: acepta `containerId` inexistente, pares de enlaces duplicados y restaura las preferencias tal cual. |
| S3 | WARNING | El editor de enlaces solo crea vínculos nota→nota; el spec pide también nota→contenedor. |
| S4 | WARNING | Una captura compuesta solo de gramática (`#solo`, `@Docs`) se rechaza, cuando el spec dice que nunca debe bloquear más allá de "no vacío". |
| S5 | WARNING | Los nombres de contenedor no son únicos entre hermanos, así que `@nombre` se liga a uno arbitrario. |
| S6 | WARNING | La importación no valida el esquema de la URL del contenedor: un `javascript:` plantado en una copia termina siendo un `href`. |
| S7 | WARNING | `downloadJson` revoca el object URL en el mismo tick del clic: documentado como la forma de romper la descarga en Firefox. |
| S8 | SUGGESTION | El store no tiene archivo de tests propio, que es justamente donde viven los hallazgos de esta revisión. |
| S9 | SUGGESTION | Una etiqueta al final de una frase deja el punto suelto en el cuerpo ("hola #tag." → "hola ."). |

### Verificado en producción durante la revisión

0 excepciones · consola vacía · 6 requests same-origin · 103 tests verdes · CSP estricto intacto. Los dos críticos son de **integridad de datos**, no de seguridad: una edición se pierde y una nota queda con un contenedor inexistente.

### Resultado de la corrección

| Ronda | Alcance | Resultado |
|---|---|---|
| 1 | C1, C2, W1, W2, W3 | Los cinco corregidos y verificados (110 tests). El re-juicio encontró **3 defectos introducidos por la propia corrección**. |
| 2 | F1, F2, F3, F4 | Los cuatro corregidos (117 tests). El re-juicio final: **ningún hallazgo severo**, los nueve ítems del ledger se sostienen. |

**Veredicto: APPROVED.** El re-juicio final no encontró ningún CRÍTICO, ni introducidos por las correcciones ni preexistentes fuera del ledger.

**Defectos que el re-juicio final dejó como info (no corregidos, por decisión de alcance):**

- *Preexistente:* dos borrados de contenedor simultáneos pueden resucitar en la base un contenedor borrado (cada borrado reescribe su propia foto de contenedores).
- *Preexistente:* un contenedor creado en otra pestaña no entra al store, así que la fila no muestra su chip hasta recargar.
- *Introducido y cerrado en la integración:* el aviso del editor prometía un cancelar imposible, y un cambio de estado que fallaba quedaba en silencio cuando la nota salía de la bandeja.
- *Restantes del ledger:* S1–S9, W4, W5 y W6 siguen abiertos, tal como estaban.

## Design system

The interface follows the **Impeccable** design skill, documented in `DESIGN.md`.

| Rule | Detail |
|---|---|
| Mode | **Operate** — a tool, not a product page. Ambition shows as precision, not expression. |
| Tokens | `src/styles/tokens.css` is the single source: type scale, space scale, radii, motion, and a deliberately achromatic chrome so the only colour on screen is information. |
| Colour does two jobs | **Kind** = what a note is (six hues, always paired with the word). **Stage** = where a note is in its life (pending / active / done / dropped). |
| Chrome is achromatic | Ink, rules and surfaces carry no hue, so a colour on screen always means something. |
| Rows, not cards | A note is a line in a register: kind in an aligned column, title carrying the weight, stage and timestamp quiet on the right. Cards are the lazy container. |
| Type | **Archivo Variable** for the interface (self-hosted, bundled woff2), **JetBrains Mono Variable** strictly for literal syntax and measurements. |
| Icons | Authored SVG in `src/ui/icons/`, one 16px grid, one 1.5 stroke. No icon library, no emoji, no Unicode glyphs. |
| Teaching surfaces | The capture grammar (`#tag`, `kind:`, `@container`) is printed where it is used, and the first-run empty state is a legend, not a placeholder. |
| Contrast | Every ink value clears 4.5:1 on its surface in both themes. |

Stylesheets are split by area (`tokens`, `base`, `shell`, `capture`, `records`, `states`) so parallel work on different surfaces does not collide in one file.

## Architecture

```
src/
├── domain/                    # pure JS — no React, no IndexedDB, no DOM
│   ├── entities/              # note.js, container.js, link.js (shapes + invariants)
│   ├── policies/              # status.js, kind.js, tag.js (normalization rules)
│   ├── usecases/              # createNote, quickCapture, setStatus, moveNote,
│   │                          # linkEntities, unlinkEntity, searchNotes,
│   │                          # exportData, importData, collectDescendants
│   └── ports/                 # noteRepository, containerRepository, linkRepository
├── infra/
│   ├── indexeddb/             # db.js (open + migrations), schema.js, *Repo.js
│   └── backup/                # jsonExport.js, jsonImport.js
├── ui/
│   ├── app/                   # App.jsx, layout/, routing (hash-based)
│   ├── components/            # QuickCapture, Sidebar, ContainerTree, NoteCard,
│   │                          # NoteEditor, StatusBadge, KindBadge, TagPicker,
│   │                          # ContainerPicker, LinkEditor, SearchBox, EmptyState
│   ├── state/                 # appStore.jsx (context + reducer + actions)
│   └── pages/                 # NotesView, ContainerView, SearchView, SettingsView
├── main.jsx
└── styles/
```

Dependency rule: `ui → domain ← infra`. The domain never imports React or IndexedDB; the infra never imports React. Dependencies are injected at composition time (in `main.jsx` / `App.jsx`).

### State management

A single `AppStore` (React context + `useReducer`) holds the hydrated snapshot: `{ notes, containers, links, prefs }`.

- On boot: repositories load everything into memory (a few thousand notes ≈ a few MB — well within limits).
- Writes: dispatch an action → run the use case → call the repository → dispatch the resulting state update.
- Reads are synchronous from the store, which makes search and tree rendering trivial.
- Scaling limit: this model is fine up to roughly 10k notes. Beyond that, replace the full load with paged queries per view. The repository ports are already shaped for that migration.

### Dependencies

| Choice | Rationale |
|---|---|
| `react`, `react-dom` | Required. |
| `vite` + `@vitejs/plugin-react` | Required. |
| `vite-plugin-pwa` (v1.1, deferred) | A precached shell needs careful invalidation on every deploy. Added later with `registerType: 'prompt'` so updates are explicit instead of silent. |
| `vitest` | Unit tests for domain use cases (the layer worth testing). |
| `jsdom` + `@testing-library/react` (dev only) | Component-level smoke test of the vertical slice. Never shipped, never a runtime dependency. |
| IndexedDB wrapper | **Decision: hand-rolled thin adapter** (~120 LOC). Zero runtime dependencies, full control of transactions, and it matches the strict "no third-party code" rule that the CSP depends on. Tradeoff: migration code is ours to own — mitigated by keeping the migration map in one file. `dexie` remains a viable swap because the domain talks only to ports. |

No UI framework, no state library, no CSS framework: plain CSS with custom properties keeps the bundle tiny and the look coherent.

## Cuándo delegar al orquestador y a los agentes

**Regla:** se delega cuando el contrato está congelado y quedan superficies **verdaderamente independientes**. Antes de eso el trabajo es de a uno: en un repo con la arquitectura todavía en movimiento, paralelizar cuesta más de lo que ahorra — tres agentes escriben tres convenciones y después hay que reconciliarlas a mano.

| Momento | Qué se delega | Quién |
|---|---|---|
| **Fase 3c/4a (hecho)** | El árbol de contenedores y los enlaces entre notas, en paralelo, con el contrato congelado antes. | Dos agentes en paralelo |
| **Fase 4c en adelante** | Filtros por tipo y etiqueta, y abrir una nota enlazada. | Orquestador |
| **Cierre de cada fase** | Dos revisores ciegos (`judgment-day`) sobre dominio, infra y el diff de UI. | Revisores |
| **Fase 6 (despliegue)** | A mano, siempre. Un agente que despliega puede cambiar el nombre del proyecto en Vercel, y ese nombre es la clave de la base de datos. | Manual |

Lo que la primera delegación demostró, y que hay que repetir: **el contrato se escribe antes, no durante**. Se agregaron al store las acciones (`updateContainer`, `nestContainer`, `createLink`, `removeLink`) y se crearon *stubs* con la firma exacta de `ContainerTree` y `ContainerPicker` antes de despachar, así que ningún agente quedó esperando al otro y la app nunca dejó de compilar. Los dos agentes reportaron sus "contract gaps" con precisión: los puentes que dejaron (un `useAppStore` como fallback) se cablearon después y se borraron.

### Contrato de reparto por archivo (obligatorio antes de despachar)

- `src/domain/**` y `src/infra/**`: **congelados**. Nadie los toca.
- `src/ui/state/appStore.jsx`: **congelado**. Las acciones que necesite cada superficie se agregan *antes* de repartir, nunca durante.
- `src/ui/lib/vocabulary.js` y `src/styles/tokens.css`: **congelados**. Los textos y los tokens se completan antes de repartir.
- `src/styles/base.css`: **congelado**.
- Cada agente tiene **un CSS propio** (`containers.css`, `search.css`, `links.css`), para que dos agentes nunca editen el mismo archivo.
- Los tests van con el código: el agente que agrega una superficie agrega también sus tests.

### Criterio de salida para delegar

Las cuatro condiciones tienen que cumplirse **antes** de llamar al orquestador:

1. `appStore.jsx` expone todas las acciones que las tres superficies necesitan.
2. `vocabulary.js` tiene los textos nuevos.
3. `tokens.css` tiene los tokens nuevos.
4. La suite está verde y el build pasa.

Después: el orquestador despacha A, B y C con el brief anterior, y el resultado vuelve a revisión ciega doble más una ronda de fixes acotada.

## Use cases (domain API)

| Use case | Input | Output / effect |
|---|---|---|
| `createNote` | `{body, title?, kind?, status?, tags?, containerId?}` | Validated, normalized note. Throws on empty body+title. |
| `quickCapture` | raw input string + current container | Parses syntax, creates note, returns it. |
| `setStatus` | `{noteId, status}` | Updates status + `updatedAt`. |
| `editNote` | `{note, title?, body?}` | Rewrites the content. An empty title falls back to the first body line; empty content is rejected. |
| `setArchived` | `{note, archived}` | Archives or restores a note. Archiving is the delete: nothing is destroyed. |
| `removeContainer` | `{containers, notes, containerId}` | Removes a container: its children move up, its notes become unclassified, nothing is lost. |
| `setKind` | `{noteId, kind}` | Updates kind. |
| `moveNote` | `{noteId, containerId}` | Re-parents a note to another container (`null` = unclassified). |
| `addTag` / `removeTag` | note + tag | Normalizes (lowercase, trim, dedupe). |
| `linkEntities` | `{source, target, relation}` | Creates a link, rejects self-links and duplicates. |
| `unlinkEntity` | `linkId` | Removes a link. |
| `collectDescendants` | `containerId` | Returns the set of descendant container ids (cycle-safe). |
| `searchNotes` | `{query, filters}` | Ranked note list. |
| `exportData` | — | Full JSON snapshot `{version, exportedAt, notes, containers, links, prefs}`. |
| `importData` | JSON | Validates shape, merges or replaces (user choice), reports counts. |

## Testing strategy

Focus on the domain — it holds the logic worth protecting.

- **Unit (vitest):** every use case, especially `quickCapture` parsing, `collectDescendants` (cycle safety), `moveNote`, `linkEntities` (duplicates/self-links), tag normalization, import validation.
- **Repository contract tests:** the same suite runs against the IndexedDB adapter with `fake-indexeddb`, so the adapter honors the port contract.
- **UI (component):** a jsdom smoke test drives the vertical slice end to end — capture → persist → reload → still there. `jsdom` and Testing Library are dev-only and never reach the bundle.
- **UI (manual):** no browser e2e in v1. Manual checklist for the flows that matter (classify → link → export).

## Acceptance criteria (MVP)

- [ ] A note can be created from the nav bar with a single `Enter` and zero other input.
- [ ] `#tag`, `kind:` and `@container` are parsed and removed from the body.
- [ ] A container can be created, renamed, nested under another container, and given a `kind` + `url`.
- [ ] The sidebar tree expands/collapses and shows note counts.
- [ ] A note can be moved to another container and the tree counts update.
- [ ] A note can be filtered by status, kind, tag and container.
- [ ] Search matches title, body and tags and ranks title matches first.
- [ ] A note can be linked to another note and to a container, with a relation type.
- [ ] Status, kind and tag changes persist across a reload.
- [ ] Export produces a valid JSON file; import restores it into an empty database with identical counts.
- [ ] After the initial asset load the app issues no network requests (verifiable in DevTools → Network).
- [ ] The production build deploys to Vercel Hobby with the configured CSP and security headers present.
- [ ] The Settings screen shows the current origin and estimated storage usage.

## Implementation phases

### Status

| Phase | State |
|---|---|
| 1 — Scaffold, IndexedDB adapter, domain, store | ✅ done |
| 2 — Quick capture, inbox, note list | ✅ done (note editor still missing) |
| 2b — Interface redesign (Impeccable, Operate mode) | ✅ done — see `DESIGN.md` |
| 2c — Spanish interface + "Acerca de" section, backup/restore | ✅ done |
| 3a — Containers CRUD (list, create, delete, file notes) | ✅ done |
| 3b — Inline note editor, archive/restore, archived scope | ✅ done |
| 3c — Nested container tree, sidebar, container filter | ✅ done |
| 4a — Links between notes | ✅ done |
| 4b — Search (`Ctrl/Cmd+K`) | ✅ done |
| 4c — Filters by type and tag, open a linked note | ✅ done |
| 5 — Settings screen, polish | 🔲 pending (export/import already live inside "Acerca de") |
| 6 — Deployment to Vercel Hobby | ✅ done — https://takefastnotes.vercel.app, auto-deploy desde `main` |
| 7 — Tests | ✅ done (101 tests: domain, adapters, UI smoke) |

### Plan

| Phase | Deliverable |
|---|---|
| 1 | Vite + React + JS scaffold, IndexedDB adapter, repositories, domain entities, store hydration. |
| 2 | Quick capture with syntax parsing, inbox view, note list, note editor (body/kind/status/tags). |
| 3 | Containers CRUD + tree sidebar + note counts + move note. |
| 4 | Links, search, filters, keyboard shortcuts. |
| 5 | Export/import, settings screen, polish and empty states. |
| 6 | Deployment: `vercel.json`, security headers, Vercel project, origin/domain decision, deploy verification. |
| 7 | Tests for the domain layer, `fake-indexeddb` repository contract tests. |

**v1.1 backlog (not v1):** offline service worker with explicit update prompt, structured decision records, Markdown export, custom status workflows.

## Decisions taken

| Question | Decision | Rationale |
|---|---|---|
| Can a note contain nested child notes? | No, not in v1 | The container tree already gives hierarchy, and typed links cover refinement. A second axis doubles the UI complexity for little gain. Deferred to v1.1. |
| Should `kind=decision` have structured fields (context, outcome, date)? | No, not in v1 | Body + tags + status carry it. Structured records are a v1.1 candidate. |
| Export formats? | JSON only in v1 | One format, one import path, easy to diff. Markdown bundle deferred to v1.1. |
| Named external URLs on notes (tickets, docs)? | Not in v1 | Inline Markdown links in the body cover it. A dedicated field is v1.1. |
| IndexedDB wrapper? | Hand-rolled thin adapter | Zero dependencies and full control of transactions; the ports keep `dexie` a cheap swap. |
| Service worker / offline? | Deferred to v1.1 | Stale-shell bugs cost more than offline access in v1. |
| Service routing style? | Hash routing | No rewrite rules; identical build works on any static host. |

## Still open (ownership decisions, not technical)

1. **Custom domain vs `*.vercel.app` subdomain.** A purchased custom domain is the most stable origin (the database key). Recommendation: start on the `vercel.app` subdomain with a deliberately chosen project name, and add a custom domain later if you want the origin to be permanent.
2. **Public deployment or Vercel Authentication.** The deployment exposes no data (everything lives in the browser), so public is safe by default. Recommendation: leave it public with `noindex`, and enable Vercel Authentication only if you want the URL itself to be private — it costs a Vercel login on every visit.

## Risks

| Risk | Mitigation |
|---|---|
| Data loss (browser clears site data, user switches browser/profile) | Prominent export, last-export timestamp in Settings, explicit origin display. |
| Domain change or project rename orphans the data | The origin is the database key. The Settings screen shows it; the project name is treated as a permanent identifier once real usage starts. Recovery is Export → Import. |
| A future dependency breaks the strict CSP | Any added dependency must be self-hosted, CSP-compatible and network-free. This rule is part of the dependency decision, not an afterthought. |
| Scope creep into a project-management tool | The `Out of scope` table is the contract; new features must justify against it. |
| Full in-memory load degrading with thousands of notes | Acceptable to ~10k notes; repository ports are pre-shaped for paged queries. |
| Ambiguous status/typology drift (three ways to say "todo") | Fixed status enum, free-form but suggested kinds and tags. |
