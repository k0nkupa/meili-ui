import type { IndexSummary } from "@/lib/meili/api"

export type IndexOverviewSort = "uid-asc" | "updated-asc" | "updated-desc"

export type IndexOverviewSearch = {
  group: string
  query: string
  sort: IndexOverviewSort
}

export type IndexOverviewRouteSearch = {
  indexGroup: string
  indexQuery: string
  indexSort: IndexOverviewSort
}

export type IndexOverviewItem = IndexSummary & {
  groupKey: string
}

export type IndexOverviewGroup = {
  indexes: Array<IndexOverviewItem>
  key: string
  latestUpdatedAt: string | null
}

export type IndexOverview = {
  filteredIndexes: number
  groups: Array<IndexOverviewGroup>
  totalGroups: number
  totalIndexes: number
}

export const DEFAULT_INDEX_OVERVIEW_SEARCH: IndexOverviewSearch = {
  group: "all",
  query: "",
  sort: "updated-desc",
}

export const DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH: IndexOverviewRouteSearch = {
  indexGroup: DEFAULT_INDEX_OVERVIEW_SEARCH.group,
  indexQuery: DEFAULT_INDEX_OVERVIEW_SEARCH.query,
  indexSort: DEFAULT_INDEX_OVERVIEW_SEARCH.sort,
}

export function buildIndexOverview(
  indexes: Array<IndexSummary>,
  search: IndexOverviewSearch
): IndexOverview {
  const normalizedQuery = search.query.trim().toLowerCase()
  const normalizedGroup = search.group.trim().toLowerCase()
  const items = indexes.map((index) => ({
    ...index,
    groupKey: getIndexGroupKey(index.uid),
  }))
  const filtered = items.filter((index) => {
    const matchesGroup =
      normalizedGroup === "" ||
      normalizedGroup === "all" ||
      index.groupKey.toLowerCase() === normalizedGroup

    if (!matchesGroup) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    return (
      index.uid.toLowerCase().includes(normalizedQuery) ||
      (index.primaryKey ?? "").toLowerCase().includes(normalizedQuery)
    )
  })

  const grouped = new Map<string, Array<IndexOverviewItem>>()

  for (const index of filtered) {
    const current = grouped.get(index.groupKey)

    if (current) {
      current.push(index)
      continue
    }

    grouped.set(index.groupKey, [index])
  }

  const groups = Array.from(grouped.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, groupIndexes]) => {
      const sortedIndexes = [...groupIndexes].sort((left, right) =>
        compareIndexes(left, right, search.sort)
      )

      return {
        indexes: sortedIndexes,
        key,
        latestUpdatedAt: getLatestUpdatedAt(sortedIndexes),
      }
    })

  return {
    filteredIndexes: filtered.length,
    groups,
    totalGroups: grouped.size,
    totalIndexes: indexes.length,
  }
}

export function getIndexGroupKey(uid: string): string {
  const [prefix] = uid.split("-")

  return prefix.trim() || uid
}

export function normalizeIndexOverviewRouteSearch(search: {
  indexGroup?: string
  indexQuery?: string
  indexSort?: string
}): IndexOverviewRouteSearch {
  return {
    indexGroup:
      typeof search.indexGroup === "string" && search.indexGroup.trim()
        ? search.indexGroup
        : DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH.indexGroup,
    indexQuery:
      typeof search.indexQuery === "string"
        ? search.indexQuery
        : DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH.indexQuery,
    indexSort:
      search.indexSort === "uid-asc" || search.indexSort === "updated-asc"
        ? search.indexSort
        : DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH.indexSort,
  }
}

export function toIndexOverviewSearch(
  search: IndexOverviewRouteSearch
): IndexOverviewSearch {
  return {
    group: search.indexGroup,
    query: search.indexQuery,
    sort: search.indexSort,
  }
}

function compareIndexes(
  left: IndexOverviewItem,
  right: IndexOverviewItem,
  sort: IndexOverviewSort
) {
  if (sort === "uid-asc") {
    return left.uid.localeCompare(right.uid)
  }

  if (sort === "updated-asc") {
    return compareUpdatedAt(left.updatedAt, right.updatedAt, "asc")
  }

  return compareUpdatedAt(left.updatedAt, right.updatedAt, "desc")
}

function compareUpdatedAt(
  left: string | undefined,
  right: string | undefined,
  direction: "asc" | "desc"
) {
  const leftValue = left ? new Date(left).getTime() : null
  const rightValue = right ? new Date(right).getTime() : null

  if (leftValue === rightValue) {
    return 0
  }

  if (leftValue === null) {
    return 1
  }

  if (rightValue === null) {
    return -1
  }

  return direction === "asc" ? leftValue - rightValue : rightValue - leftValue
}

function getLatestUpdatedAt(indexes: Array<IndexOverviewItem>) {
  for (const index of indexes) {
    if (index.updatedAt) {
      return index.updatedAt
    }
  }

  return null
}
