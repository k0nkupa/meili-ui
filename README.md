# Meili UI

<p align="center">
  An internal admin UI for Meilisearch instances.
  <br />
  Fast to open, browser-local, and built for the jobs that are awkward in raw JSON and curl.
</p>

## Why Meili UI

Meili UI is an internal React app for inspecting and maintaining Meilisearch
instances. It is built with TanStack Start, TanStack Router, TypeScript,
Tailwind CSS, and shadcn/basecn primitives.

The app is intentionally local-first in this phase. There is no login,
server-side proxy, or shared persistence. Users enter a Meilisearch host and
API key in the browser, and the app stores those values in `localStorage`.

It currently focuses on the core admin workflow:

- Save and switch between multiple Meilisearch instances
- Browse indexes for a selected instance
- Create new indexes
- View index documents as a table or raw JSON
- Search and paginate document results
- Create, edit, and delete single documents through JSON
- Inspect recent tasks with status, type, and index filters
- View and patch index settings as raw JSON

## Highlights

- Browser-local instance storage with quick reconnects
- Route-driven UI powered by TanStack Router
- Index overview with grouping, search, sorting, and refresh controls
- Document table view with derived columns and primary-key awareness
- Raw JSON document view for payload inspection
- Single-document create, edit, and delete flows
- Recent task inspection for operational follow-up
- Raw index settings editor for focused maintenance
- Focused Vitest coverage for storage, index overview, tasks, and documents

## Status

Meili UI is usable for internal Meilisearch maintenance, but it is still an
internal-only tool. The current phase favors direct access and fast iteration
over hardened deployment boundaries.

Current limits:

- No authentication
- No server-side Meilisearch proxy
- No shared team persistence
- No bulk document import or delete
- No instance-wide settings editor
- API keys are stored in plaintext browser `localStorage`

That last one is intentional for now. It is fine only for trusted internal use
with scoped keys, and a terrible idea for anything public. Software has
standards.

## Security Notes

- Do not deploy this as a public shared admin surface in its current shape.
- Do not enter production master keys in a hosted copy of this app.
- Prefer scoped Meilisearch keys with the least privilege needed for the task.
- A public deployment needs a server-side proxy or short-lived token flow so
  admin credentials never live in browser storage.
- Saved hosts are limited to `http` and `https` URLs without embedded
  credentials, query strings, or fragments.

## Security

See `SECURITY.md` for vulnerability reporting and security scope.

This repo is currently an internal admin UI. Do not deploy it to the public
internet as-is: it stores Meilisearch API keys in browser storage and does not
implement first-party authz in this repo.

## Requirements

- Bun
- Node-compatible local development environment
- Access to a Meilisearch host and API key

## Quick Start

```bash
bun install
bun run dev
```

The dev server runs on:

```text
http://localhost:3000
```

Useful development commands:

```bash
bun run test
bun run typecheck
bun run lint
bun run build
bun run preview
```

## Project Structure

```text
src/
  components/ui/       Shared shadcn/basecn primitives
  features/meili/      Page-level Meilisearch UI compositions
  hooks/               Shared React hooks
  lib/meili/           Storage, API helpers, and domain utilities
  routes/              TanStack Router routes
  router.tsx           Router setup
  routeTree.gen.ts     Generated route tree
  styles.css           Global styles and Tailwind theme
public/
  favicon.ico
  manifest.json
  robots.txt
```

Feature logic should stay close to the route or component that owns it. This
repo is intentionally small, so avoid broad folder hierarchies until the code
actually earns them.

## Configuration

Runtime Meilisearch connection details are entered through the UI. The app does
not read `.env` values at runtime.

Local validation can still use environment values such as:

```text
MEILISEARCH_URL
MEILISEARCH_API_KEY
MEILISEARCH_BIV_PRODUCT_INDEX
```

Those values are for developer workflows only. The product flow is manual entry
in the browser.

## Testing

The current test suite covers:

- Saved instance storage behavior
- Index overview grouping, sorting, and filtering
- Document column derivation and document utilities
- Task selection reconciliation
- Document viewer rendering

Run the suite with:

```bash
bun run test
```

Before opening a PR, run:

```bash
bun run typecheck
bun run lint
bun run test
```

## Contributing

Keep changes focused and route-aware. Prefer existing aliases such as
`@/components/ui/button`, keep generated route updates explicit, and use the
repo formatter instead of hand-polishing whitespace.

Before sending UI changes, include screenshots and call out any route, generated
file, or Meilisearch behavior changes.
