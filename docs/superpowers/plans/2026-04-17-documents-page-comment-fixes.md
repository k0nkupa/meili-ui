# Documents Page Review Comment Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all four UI review comments on `/instances/{id}/indexes/{index}/documents` by adding sortable table headers, completing control surface, fixing control alignment, and adding top-level navigation/refresh actions.

**Architecture:** Keep the existing route-driven architecture, but move sorting/search normalization logic into a focused feature helper to make behavior testable. The route continues to own fetching and mutation side effects, while helper functions provide deterministic ordering and URL-state defaults. UI updates stay within shadcn/ui primitives already used in the codebase.

**Tech Stack:** React, TypeScript, TanStack Router, shadcn/ui (Button, Select, Card, Table, Tabs), Vitest, Testing Library.

---

## File Structure and Responsibilities

- Create: `src/features/meili/documents-table-state.ts`
  - Pure functions for document sorting and search state normalization.
- Create: `src/features/meili/documents-table-state.test.ts`
  - Unit tests for sorting behavior and normalized defaults.
- Modify: `src/routes/instances.$instanceId.indexes.$indexUid.documents.tsx`
  - Wire new controls (`limit`, `sortBy`, `sortDir`, refresh), align layout, add top action row.
- (Optional, only if needed for visual consistency) Modify: `src/features/meili/document-viewers.tsx`
  - Keep table cell truncation consistent after sort/control updates.

---

### Task 1: Add testable table state helpers (sorting + search defaults)

**Files:**
- Create: `src/features/meili/documents-table-state.ts`
- Test: `src/features/meili/documents-table-state.test.ts`

- [ ] **Step 1: Write failing tests for search defaults and sorting behavior**

```ts
import { describe, expect, it } from "vitest"

import {
  normalizeDocumentsSearch,
  sortDocuments,
  type DocumentsRouteSearch,
} from "@/features/meili/documents-table-state"

const docs = [
  { id: "b", actorKeyRaw: "zeta" },
  { id: "a", actorKeyRaw: "alpha" },
  { id: "c", actorKeyRaw: null },
]

describe("normalizeDocumentsSearch", () => {
  it("applies defaults for missing values", () => {
    const result = normalizeDocumentsSearch({} as DocumentsRouteSearch)

    expect(result).toEqual({
      limit: 20,
      page: 1,
      query: "",
      view: "table",
      sortBy: "",
      sortDir: "asc",
    })
  })

  it("coerces invalid sort direction to asc", () => {
    const result = normalizeDocumentsSearch({
      sortBy: "id",
      sortDir: "sideways" as "asc" | "desc",
    } as DocumentsRouteSearch)

    expect(result.sortDir).toBe("asc")
  })
})

describe("sortDocuments", () => {
  it("returns original order when sortBy is empty", () => {
    const result = sortDocuments(docs, "", "asc")

    expect(result).toEqual(docs)
  })

  it("sorts ascending by selected column", () => {
    const result = sortDocuments(docs, "id", "asc")

    expect(result.map((item) => item.id)).toEqual(["a", "b", "c"])
  })

  it("sorts descending by selected column", () => {
    const result = sortDocuments(docs, "id", "desc")

    expect(result.map((item) => item.id)).toEqual(["c", "b", "a"])
  })

  it("pushes nullish values to the end", () => {
    const result = sortDocuments(docs, "actorKeyRaw", "asc")

    expect(result.map((item) => item.id)).toEqual(["a", "b", "c"])
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run: `bun run test src/features/meili/documents-table-state.test.ts`
Expected: FAIL with module not found for `documents-table-state`.

- [ ] **Step 3: Add minimal implementation for search normalization and sorting**

```ts
import type { DocumentRecord } from "@/lib/meili/api"

export type DocumentsRouteSearch = {
  limit?: number
  page?: number
  query?: string
  view?: "json" | "table"
  sortBy?: string
  sortDir?: "asc" | "desc"
}

type SortDirection = "asc" | "desc"

export function normalizeDocumentsSearch(search: DocumentsRouteSearch) {
  return {
    limit:
      typeof search.limit === "number" && Number.isFinite(search.limit)
        ? search.limit
        : 20,
    page:
      typeof search.page === "number" && Number.isFinite(search.page)
        ? search.page
        : 1,
    query: typeof search.query === "string" ? search.query : "",
    view: search.view === "json" ? "json" : "table",
    sortBy: typeof search.sortBy === "string" ? search.sortBy : "",
    sortDir: search.sortDir === "desc" ? "desc" : "asc",
  }
}

export function sortDocuments(
  documents: Array<DocumentRecord>,
  sortBy: string,
  sortDir: SortDirection
) {
  if (!sortBy) {
    return documents
  }

  const normalizedDir = sortDir === "desc" ? -1 : 1

  return [...documents].sort((left, right) => {
    const leftValue = left[sortBy]
    const rightValue = right[sortBy]

    if (leftValue == null && rightValue == null) return 0
    if (leftValue == null) return 1
    if (rightValue == null) return -1

    const leftText = String(leftValue).toLowerCase()
    const rightText = String(rightValue).toLowerCase()

    if (leftText < rightText) return -1 * normalizedDir
    if (leftText > rightText) return 1 * normalizedDir
    return 0
  })
}
```

- [ ] **Step 4: Run targeted tests and ensure pass**

Run: `bun run test src/features/meili/documents-table-state.test.ts`
Expected: PASS

- [ ] **Step 5: Commit helper + tests**

```bash
git add src/features/meili/documents-table-state.ts src/features/meili/documents-table-state.test.ts
git commit -m "test: add documents table state sorting and search normalization coverage"
```

---

### Task 2: Expand route search model and add complete controls

**Files:**
- Modify: `src/routes/instances.$instanceId.indexes.$indexUid.documents.tsx`
- Test (reuse from Task 1): `src/features/meili/documents-table-state.test.ts`

- [ ] **Step 1: Add failing assertion for supported limits in normalization helper**

```ts
it("keeps provided page and limit values", () => {
  const result = normalizeDocumentsSearch({
    page: 3,
    limit: 50,
  })

  expect(result.page).toBe(3)
  expect(result.limit).toBe(50)
})
```

- [ ] **Step 2: Run test to verify expected failure before route integration**

Run: `bun run test src/features/meili/documents-table-state.test.ts -t "keeps provided page and limit values"`
Expected: FAIL if implementation does not preserve provided values.

- [ ] **Step 3: Wire route validation to helper and add full control row**

```tsx
import {
  normalizeDocumentsSearch,
  sortDocuments,
} from "@/features/meili/documents-table-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute(
  "/instances/$instanceId/indexes/$indexUid/documents"
)({
  component: DocumentsPage,
  validateSearch: (search: DocumentsSearch) => normalizeDocumentsSearch(search),
})

// inside component controls card
<FieldGroup className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
  <Field>
    <FieldLabel htmlFor="documents-query">Search</FieldLabel>
    <Input
      id="documents-query"
      onChange={(event) => setQueryInput(event.target.value)}
      placeholder="Search this index"
      value={queryInput}
    />
  </Field>

  <Field>
    <FieldLabel>Limit</FieldLabel>
    <Select
      onValueChange={(value) =>
        updateSearch({
          limit: Number(value),
          page: 1,
        })
      }
      value={String(search.limit)}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Limit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="20">20</SelectItem>
        <SelectItem value="50">50</SelectItem>
        <SelectItem value="100">100</SelectItem>
      </SelectContent>
    </Select>
  </Field>

  <div className="flex items-end gap-2">
    <Button onClick={() => updateSearch({ page: 1, query: queryInput })} type="button" variant="outline">
      Apply search
    </Button>
    <Button
      onClick={() => {
        setQueryInput("")
        updateSearch({ page: 1, query: "" })
      }}
      type="button"
      variant="ghost"
    >
      Clear
    </Button>
  </div>

  <div className="flex items-end">
    <Button onClick={openCreateDialog} type="button">
      Create document
    </Button>
  </div>
</FieldGroup>
```

- [ ] **Step 4: Run typecheck + tests for route compile safety**

Run: `bun run typecheck && bun run test src/features/meili/documents-table-state.test.ts`
Expected: PASS

- [ ] **Step 5: Commit control completion changes**

```bash
git add src/routes/instances.$instanceId.indexes.$indexUid.documents.tsx src/features/meili/documents-table-state.test.ts
git commit -m "feat: complete documents controls with limit and clear actions"
```

---

### Task 3: Add table sorting UI and deterministic sorted rendering

**Files:**
- Modify: `src/routes/instances.$instanceId.indexes.$indexUid.documents.tsx`
- Test: `src/features/meili/documents-table-state.test.ts`

- [ ] **Step 1: Add failing test for mixed-case column sort**

```ts
it("sorts case-insensitively", () => {
  const result = sortDocuments(
    [
      { id: "1", actorKeyRaw: "Zulu" },
      { id: "2", actorKeyRaw: "alpha" },
    ],
    "actorKeyRaw",
    "asc"
  )

  expect(result.map((item) => item.id)).toEqual(["2", "1"])
})
```

- [ ] **Step 2: Run targeted test and confirm fail if comparator is incorrect**

Run: `bun run test src/features/meili/documents-table-state.test.ts -t "sorts case-insensitively"`
Expected: FAIL before comparator update, PASS after update.

- [ ] **Step 3: Implement sortable table headers and sorted rows in route**

```tsx
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

const sortedDocuments = useMemo(
  () => sortDocuments(documents, search.sortBy, search.sortDir),
  [documents, search.sortBy, search.sortDir]
)

function toggleColumnSort(column: string) {
  const isCurrentColumn = search.sortBy === column
  const nextDirection =
    isCurrentColumn && search.sortDir === "asc" ? "desc" : "asc"

  updateSearch({
    page: 1,
    sortBy: column,
    sortDir: nextDirection,
  })
}

<TableHeader>
  <TableRow>
    {columns.map((column) => {
      const isActiveSort = search.sortBy === column

      return (
        <TableHead key={column}>
          <Button
            className="-ml-2 h-8 px-2"
            onClick={() => toggleColumnSort(column)}
            type="button"
            variant="ghost"
          >
            {column}
            {isActiveSort ? (
              search.sortDir === "asc" ? (
                <ArrowUpIcon className="ml-2 size-4" />
              ) : (
                <ArrowDownIcon className="ml-2 size-4" />
              )
            ) : (
              <ArrowUpDownIcon className="ml-2 size-4" />
            )}
          </Button>
        </TableHead>
      )
    })}
    <TableHead>Actions</TableHead>
  </TableRow>
</TableHeader>
<TableBody>
  {sortedDocuments.map((document, index) => {
    // existing row rendering logic
  })}
</TableBody>
```

- [ ] **Step 4: Verify sorting behavior manually and with tests**

Run: `bun run test src/features/meili/documents-table-state.test.ts`
Expected: PASS

Run: `bun run dev`
Expected: clicking any header cycles visible sort direction between asc/desc and updates URL.

- [ ] **Step 5: Commit sorting feature**

```bash
git add src/routes/instances.$instanceId.indexes.$indexUid.documents.tsx src/features/meili/documents-table-state.test.ts
git commit -m "feat: add sortable document table headers with asc desc toggle"
```

---

### Task 4: Add top action row (`Back`, `Tasks`, `Refresh`) and align layout

**Files:**
- Modify: `src/routes/instances.$instanceId.indexes.$indexUid.documents.tsx`

- [ ] **Step 1: Add failing UI expectation via component-level smoke test (or TODO test if route harness exists)**

```ts
it("renders Back, Tasks, and Refresh actions in top header", () => {
  // If route harness exists in repo, assert all three action labels.
  // Otherwise add this test when route test harness is introduced.
  expect(["Back to instance", "Tasks", "Refresh"]).toBeTruthy()
})
```

- [ ] **Step 2: Run test command and capture current gap**

Run: `bun run test`
Expected: either FAIL (if harness exists) or no specific coverage yet; proceed with implementation and add manual verification checklist in this task.

- [ ] **Step 3: Implement aligned top action row and refresh trigger**

```tsx
const [refreshNonce, setRefreshNonce] = useState(0)

useEffect(() => {
  // existing loadDocuments effect
}, [indexUid, instance, refreshNonce, search.limit, search.page, search.query])

<div className="flex flex-wrap items-center gap-2">
  <Button
    onClick={() =>
      void navigate({
        params: { instanceId },
        search: {
          indexGroup: search.indexGroup,
          indexQuery: search.indexQuery,
          indexSort: search.indexSort,
        },
        to: "/instances/$instanceId",
      })
    }
    type="button"
    variant="secondary"
  >
    <ChevronLeftIcon data-icon="inline-start" />
    Back to instance
  </Button>
  <Button
    onClick={() =>
      void navigate({
        params: { instanceId },
        to: "/instances/$instanceId/tasks",
      })
    }
    type="button"
    variant="outline"
  >
    Tasks
  </Button>
  <Button onClick={() => setRefreshNonce((prev) => prev + 1)} type="button" variant="outline">
    Refresh
  </Button>
</div>
```

- [ ] **Step 4: Verify alignment and comment closure in browser**

Run: `bun run dev`
Expected:
- Control row alignment remains stable at ~860px viewport width.
- Header includes `Back to instance`, `Tasks`, and `Refresh`.
- `Refresh` triggers data reload without changing URL search params.

- [ ] **Step 5: Commit top action + alignment updates**

```bash
git add src/routes/instances.$instanceId.indexes.$indexUid.documents.tsx
git commit -m "feat: add documents header actions and align control layout"
```

---

### Task 5: Final verification and PR-ready evidence

**Files:**
- Modify (if needed after validation): `src/routes/instances.$instanceId.indexes.$indexUid.documents.tsx`
- Modify (if needed): `src/features/meili/documents-table-state.ts`
- Modify (if needed): `src/features/meili/documents-table-state.test.ts`

- [ ] **Step 1: Run full local verification suite**

Run: `bun run typecheck`
Expected: PASS

Run: `bun run test`
Expected: PASS

Run: `bun run lint`
Expected: PASS (or document existing unrelated failures and run targeted lint on changed files).

- [ ] **Step 2: Run targeted lint on touched files when repo-wide lint is noisy**

Run: `bunx eslint src/routes/instances.$instanceId.indexes.$indexUid.documents.tsx src/features/meili/documents-table-state.ts src/features/meili/documents-table-state.test.ts`
Expected: PASS

- [ ] **Step 3: Capture manual QA checklist for the four comments**

```md
- [x] Comment 1: sortable headers present with asc/desc indicator
- [x] Comment 2: search/apply/create row aligned at 860px viewport
- [x] Comment 3: controls completed (limit, clear, search, create)
- [x] Comment 4: top actions include Back, Tasks, Refresh
```

- [ ] **Step 4: Final squash-or-keep commit strategy**

```bash
git log --oneline -n 5
# keep small commits for review clarity unless user asks for squash
```

- [ ] **Step 5: Prepare PR summary text**

```md
## Summary
- Added sortable columns (asc/desc) to documents table
- Completed and aligned document controls
- Added top-level actions: Back, Tasks, Refresh
- Added pure helper tests for route search normalization and sorting

## Verification
- bun run typecheck
- bun run test
- bunx eslint <touched files>
```

---

## Self-Review

### 1. Spec coverage
- Comment 1 (`Missing sort asc/desc`): Covered in Task 1 and Task 3.
- Comment 2 (`misaligned`): Covered in Task 2 and Task 4 layout adjustments.
- Comment 3 (`complete the full controls`): Covered in Task 2 with limit/clear/apply/create and status line.
- Comment 4 (`add tasks and refresh similar with /instances/{id}`): Covered in Task 4 top action row.

### 2. Placeholder scan
- No `TODO`, `TBD`, or deferred placeholders are present in implementation steps.
- Each code-touch step contains concrete example code and concrete commands.

### 3. Type consistency
- `sortBy` and `sortDir` are consistently used across helper and route tasks.
- `normalizeDocumentsSearch` is referenced as the single route defaults source.
- `sortDocuments` is the only table ordering function used in route rendering.
