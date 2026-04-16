import { describe, expect, test } from "vitest"

import {
  normalizeDocumentsSearch,
  sortDocuments,
} from "@/features/meili/documents-table-state"

describe("documents table state", () => {
  test("normalizes missing search values to defaults", () => {
    expect(normalizeDocumentsSearch(undefined)).toEqual({
      limit: 20,
      page: 1,
      query: "",
      view: "table",
      sortBy: "",
      sortDir: "asc",
    })

    expect(
      normalizeDocumentsSearch({
        limit: Number.NaN,
        page: Number.POSITIVE_INFINITY,
        query: 42 as unknown as string,
        view: "not-json" as "json" | "table",
        sortBy: null as unknown as string,
      })
    ).toEqual({
      limit: 20,
      page: 1,
      query: "",
      view: "table",
      sortBy: "",
      sortDir: "asc",
    })
  })

  test("coerces sortDir to asc unless explicitly desc", () => {
    expect(
      normalizeDocumentsSearch({
        sortDir: "desc",
      })
    ).toMatchObject({ sortDir: "desc" })

    expect(
      normalizeDocumentsSearch({
        sortDir: "DESC" as "asc" | "desc",
      })
    ).toMatchObject({ sortDir: "asc" })
  })

  test("returns the original array when sortBy is empty", () => {
    const documents = [
      { id: "b", title: "Bravo" },
      { id: "a", title: "Alpha" },
    ]

    const result = sortDocuments(documents, "", "asc")

    expect(result).toBe(documents)
    expect(result.map((document) => document.id)).toEqual(["b", "a"])
  })

  test("sorts documents ascending case-insensitively", () => {
    const documents = [
      { id: "1", actor: "Zulu" },
      { id: "2", actor: "alpha" },
      { id: "3", actor: "Bravo" },
    ]

    const result = sortDocuments(documents, "actor", "asc")

    expect(result.map((document) => document.actor)).toEqual([
      "alpha",
      "Bravo",
      "Zulu",
    ])
  })

  test("sorts documents descending case-insensitively", () => {
    const documents = [
      { id: "1", actor: "Zulu" },
      { id: "2", actor: "alpha" },
      { id: "3", actor: "Bravo" },
    ]

    const result = sortDocuments(documents, "actor", "desc")

    expect(result.map((document) => document.actor)).toEqual([
      "Zulu",
      "Bravo",
      "alpha",
    ])
  })

  test("keeps null and undefined values at the end for asc and desc", () => {
    const documents = [
      { id: "1", actor: null },
      { id: "2", actor: "bravo" },
      { id: "3", actor: undefined },
      { id: "4", actor: "alpha" },
    ]

    const ascending = sortDocuments(documents, "actor", "asc")
    const descending = sortDocuments(documents, "actor", "desc")

    expect(ascending.map((document) => document.id)).toEqual([
      "4",
      "2",
      "1",
      "3",
    ])
    expect(descending.map((document) => document.id)).toEqual([
      "2",
      "4",
      "1",
      "3",
    ])
  })
})
