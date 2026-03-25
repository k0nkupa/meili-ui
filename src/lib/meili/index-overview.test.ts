import { describe, expect, test } from "vitest"

import type { IndexSummary } from "@/lib/meili/api"
import type { IndexOverviewSearch } from "@/lib/meili/index-overview"
import { buildIndexOverview } from "@/lib/meili/index-overview"

const indexes: Array<IndexSummary> = [
  {
    primaryKey: "id",
    uid: "catalog-products",
    updatedAt: "2026-03-24T12:00:00.000Z",
  },
  {
    primaryKey: "sku",
    uid: "catalog-variants",
    updatedAt: "2026-03-25T09:00:00.000Z",
  },
  {
    primaryKey: null,
    uid: "content-pages",
    updatedAt: "2026-03-20T08:00:00.000Z",
  },
  {
    primaryKey: null,
    uid: "orphans",
    updatedAt: undefined,
  },
]

describe("index overview helpers", () => {
  test("groups indexes by the prefix before the first hyphen", () => {
    const overview = buildIndexOverview(indexes, defaultSearch())

    expect(overview.totalIndexes).toBe(4)
    expect(overview.filteredIndexes).toBe(4)
    expect(overview.groups.map((group) => group.key)).toEqual([
      "catalog",
      "content",
      "orphans",
    ])
    expect(overview.groups[0]?.indexes.map((index) => index.uid)).toEqual([
      "catalog-variants",
      "catalog-products",
    ])
    expect(overview.groups[2]?.indexes[0]?.groupKey).toBe("orphans")
  })

  test("filters by uid and primary key across all groups", () => {
    const byUid = buildIndexOverview(indexes, defaultSearch({ query: "pages" }))
    const byPrimaryKey = buildIndexOverview(
      indexes,
      defaultSearch({ query: "sku" })
    )

    expect(byUid.filteredIndexes).toBe(1)
    expect(byUid.groups.map((group) => group.key)).toEqual(["content"])
    expect(byUid.groups[0]?.indexes[0]?.uid).toBe("content-pages")

    expect(byPrimaryKey.filteredIndexes).toBe(1)
    expect(byPrimaryKey.groups.map((group) => group.key)).toEqual(["catalog"])
    expect(byPrimaryKey.groups[0]?.indexes[0]?.uid).toBe("catalog-variants")
  })

  test("applies group filters and alternate sort orders", () => {
    const groupFiltered = buildIndexOverview(
      indexes,
      defaultSearch({ group: "catalog" })
    )
    const uidSorted = buildIndexOverview(
      indexes,
      defaultSearch({ sort: "uid-asc" })
    )
    const updatedAscending = buildIndexOverview(
      indexes,
      defaultSearch({ sort: "updated-asc" })
    )

    expect(groupFiltered.filteredIndexes).toBe(2)
    expect(groupFiltered.groups.map((group) => group.key)).toEqual(["catalog"])

    expect(uidSorted.groups[0]?.indexes.map((index) => index.uid)).toEqual([
      "catalog-products",
      "catalog-variants",
    ])
    expect(
      updatedAscending.groups[0]?.indexes.map((index) => index.uid)
    ).toEqual(["catalog-products", "catalog-variants"])
    expect(updatedAscending.groups[2]?.indexes[0]?.uid).toBe("orphans")
  })
})

function defaultSearch(
  overrides: Partial<IndexOverviewSearch> = {}
): IndexOverviewSearch {
  return {
    group: "all",
    query: "",
    sort: "updated-desc",
    ...overrides,
  }
}
