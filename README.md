# Meili UI

Internal Meilisearch admin UI built with TanStack Start, React, TypeScript, Tailwind, and shadcn/basecn components.

This app is for internal use. In the current phase there is no login, no server-side proxy, and no shared persistence. Users enter a Meilisearch host and API key in the browser, and the app stores those values in `localStorage`.

## What It Does

- Save multiple Meilisearch instances in `localStorage`
- Select an instance and browse its indexes
- View index documents as a table or raw JSON
- Create, edit, and delete single documents through JSON
- Inspect recent tasks
- View and update index settings as raw JSON

## Current Limits

- No authentication yet
- No bulk document import or delete
- No instance-wide settings editor
- API keys are stored in plaintext in browser `localStorage`

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

This repo is currently an internal admin UI. Do not deploy it to the public internet as-is: it stores Meilisearch API keys in browser storage and does not implement first-party authz in this repo.

## Tech Stack

- React 19 + TypeScript
- TanStack Start + TanStack Router
- Tailwind CSS v4
- shadcn/ui and basecn primitives
- Meilisearch JavaScript client
- Vitest for unit tests

## Local Development

Install dependencies:

```bash
bun install
```

Start the app on `http://localhost:3000`:

```bash
bun run dev
```

Other useful commands:

```bash
bun run test
bun run typecheck
bun run build
bun run lint
```

## Project Structure

- `src/routes/`: app pages and route-driven UI
- `src/features/meili/`: page-level Meilisearch UI compositions
- `src/lib/meili/`: storage, client helpers, and document utilities
- `src/components/ui/`: shared shadcn/basecn primitives

## Notes For Validation

Local validation can use `.env` values such as `MEILISEARCH_URL`, `MEILISEARCH_API_KEY`, and `MEILISEARCH_BIV_PRODUCT_INDEX`, but the app itself does not read them at runtime. The intended product flow is still manual entry through the UI.
