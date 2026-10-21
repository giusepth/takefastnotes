# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite 8 + plain JavaScript (no TypeScript). Plain CSS with custom properties; no UI framework, no CSS-in-JS, no runtime state library. Persistence is IndexedDB through a repository adapter behind domain ports. Ships as a static build to Vercel Hobby (no server, no functions, no secrets, no network calls at runtime). Test stack: Vitest + jsdom + Testing Library (dev only).

## Users

A developer who needs to capture a thought in seconds and relate it to a context later. The author uses it to tie notes to GitHub repositories — features to add, bugs to fix, decisions made — but the model is deliberately generic: any person can bind notes to a document, a folder, a client or a service. Secondary audience: anyone who keeps a personal knowledge log and resents tools that make them log in.

## Product Purpose

Capture a note in one keystroke, then organize it when there is time. Success means: the thought is never lost because capture was friction, and no organizational step is ever required to save something. Everything lives in the browser; the data never leaves the machine.

## Positioning

The capture is the product. Organization is a second act that must never block the first. No account, no server, no sync, no network: the app is a local-first instrument, not a service. The generic "container" model is what lets one tool serve repositories for a developer and documents for an archivist without a mode switch.

## Operating Context

Used between coding tasks, on a laptop, sometimes on a phone over the LAN. The author thinks in repositories, features, fixes and decisions; the app must make those four shapes of thought reachable in under a second. Sessions are short and bursty: capture several thoughts, leave, come back later and triage.

## Capabilities and Constraints

Confirmed functionality (shipped): quick capture from the nav bar with inline syntax (`#tag`, `kind:` prefix, `@container`), a note list with inbox/all scopes, an "Acerca de" section that states the product's purpose, its usage and its data policy, JSON backup and restore, and local persistence.

Planned, not yet built — do not fake these as UI: container tree and sidebar, note editor, links between notes, search and filters, export/import screens, settings screen.

Hard technical constraints (breaking any of them breaks the product promise):

- **Strict Content Security Policy.** No inline scripts, no inline styles, no `unsafe-inline`. `connect-src 'none'`: the running app must issue zero network requests after the initial asset load.
- **No external resources.** No CDN, no Google Fonts, no analytics, no error tracking. Fonts must be self-hosted and bundled (npm font package or local woff2 files). Icons are authored SVG in one consistent stroke and weight — never emoji or Unicode glyphs standing in for icons.
- **Zero third-party runtime code.** React and ReactDOM only.
- **Plain CSS only**, with design tokens as custom properties. No inline `style` props anywhere, ever.
- The domain layer (`src/domain/`), the persistence layer (`src/infra/`) and the store contract are frozen. A design change may not alter data shapes, use case behavior or the store's action surface.

Language: **the interface speaks Spanish** (neutral, professional Spanish — not a regional variant). The user decided this explicitly: the primary audience is a Spanish-speaking developer. Copy may be rewritten for clarity, but it stays Spanish and stays in the product's own voice — terse and technical, never chatty. The domain keeps canonical English identifiers (`feature`, `inbox`); only the presentation layer is translated, so an exported backup still carries stable ids.

## Brand Commitments

Name: **TakeFastNotes**. The name promises speed and capture, so the interface must feel instant: no spinners, no confirmation dialogs, no state that requires interpretation. No logo, no mascot, no marketing surface — this is a tool, and it should look like one.

## Evidence on Hand

None. No users, testimonials, benchmarks or case studies exist, and none may be invented. The only evidence is the working vertical slice and its automated tests (60 passing at time of writing). Real copy must therefore be plausible and unclaimed.

## Product Principles

1. **Capture before organization.** Saving must never depend on classification.
2. **One keystroke to durable.** If it takes more than a keypress to lose a thought, the thought is at risk.
3. **Local and exportable.** The data lives in the browser and can always leave it in a readable format.
4. **Zero network, zero account, zero ceremony.** Every feature that needs a server is out of scope by definition.
5. **Keyboard-first.** A developer capturing notes wants keystrokes, not dialogs.

## Accessibility & Inclusion

WCAG AA contrast (body text ≥ 4.5:1), full keyboard operation with visible focus, semantic HTML, and a layout that stays usable at 390 px width. No interaction may depend on hover alone. The interface is in Spanish, and it must read as professionally written Spanish rather than a translation: neutral register, no regional slang, no anglicisms where a Spanish word is equally clear.
