# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the app code. Routes live in `src/routes/` and are wired through TanStack Router via `src/router.tsx` and the generated `src/routeTree.gen.ts`. Shared UI primitives live in `src/components/ui/`, helpers in `src/lib/`, hooks in `src/hooks/`, and global styles in `src/styles.css`. Static assets belong in `public/`. Keep new feature code close to the route or component that owns it; this repo is small, so don’t invent a grand empire of folders yet.

## Build, Test, and Development Commands
- `bun install`: install dependencies from `bun.lock`.
- `bun run dev`: start Vite on `http://localhost:3000`.
- `bun run build`: create a production build.
- `bun run preview`: serve the built app locally.
- `bun run test`: run Vitest once.
- `bun run typecheck`: run `tsc --noEmit`.
- `bun run lint`: run ESLint with `@tanstack/eslint-config`.
- `bun run format`: run Prettier on TS/TSX/JS/JSX files.

Run `typecheck`, `lint`, and `test` before opening a PR. Broken builds are not a personality trait.

## Coding Style & Naming Conventions
Use TypeScript and React function components. Prettier is the formatter here: 2-space indentation, no semicolons, double quotes, trailing commas `es5`, max line width 80, and Tailwind class sorting via `prettier-plugin-tailwindcss`. ESLint comes from `eslint.config.js`.

Use PascalCase for React components (`UserMenu.tsx`), camelCase for hooks and utilities (`useMobile.ts`, `formatDate.ts`), and keep route files aligned with TanStack conventions (`index.tsx`, `__root.tsx`). Prefer imports through the configured aliases in `components.json`, such as `@/components/ui/button`.

## Testing Guidelines
Vitest and Testing Library are installed. Add tests for new behavior using `*.test.ts` or `*.test.tsx`, colocated with the source file or under a nearby `__tests__/` folder. Focus on route behavior, component interaction, and utility logic. If UI behavior is hard to reason about, that is usually your code asking for a test.

## Commit & Pull Request Guidelines
Git history currently uses Conventional Commits (`feat: initial commit`). Keep that format: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`. PRs should include a short summary, testing notes, and screenshots for UI changes. Call out route changes, generated file updates, and any follow-up work explicitly.

## Configuration Notes
Shadcn/ui is configured through `components.json` with aliases rooted at `@/`. When adding primitives, prefer the existing `src/components/ui/` location and keep Tailwind tokens in `src/styles.css` consistent with the current theme.
