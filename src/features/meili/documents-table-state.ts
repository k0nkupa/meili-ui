export type DocumentsRouteSearch = {
  limit: number
  page: number
  query: string
  view: "json" | "table"
  sortBy: string
  sortDir: "asc" | "desc"
}

export function normalizeDocumentsSearch(
  search: Partial<DocumentsRouteSearch> | null | undefined
): DocumentsRouteSearch {
  return {
    limit:
      typeof search?.limit === "number" && Number.isFinite(search.limit)
        ? search.limit
        : 20,
    page:
      typeof search?.page === "number" && Number.isFinite(search.page)
        ? search.page
        : 1,
    query: typeof search?.query === "string" ? search.query : "",
    view: search?.view === "json" ? "json" : "table",
    sortBy: typeof search?.sortBy === "string" ? search.sortBy : "",
    sortDir: search?.sortDir === "desc" ? "desc" : "asc",
  }
}

export function sortDocuments<TDocument extends Record<string, unknown>>(
  documents: Array<TDocument>,
  sortBy: string,
  sortDir: "asc" | "desc"
): Array<TDocument> {
  if (!sortBy) {
    return documents
  }

  return [...documents].sort((leftDocument, rightDocument) => {
    const leftValue = leftDocument[sortBy]
    const rightValue = rightDocument[sortBy]
    const leftIsNullish = leftValue === null || typeof leftValue === "undefined"
    const rightIsNullish =
      rightValue === null || typeof rightValue === "undefined"

    if (leftIsNullish && !rightIsNullish) {
      return 1
    }

    if (!leftIsNullish && rightIsNullish) {
      return -1
    }

    if (leftIsNullish && rightIsNullish) {
      return 0
    }

    const leftComparable = String(leftValue).toLowerCase()
    const rightComparable = String(rightValue).toLowerCase()
    const comparison = leftComparable.localeCompare(rightComparable)

    return sortDir === "desc" ? -comparison : comparison
  })
}
