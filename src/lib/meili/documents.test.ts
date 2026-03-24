import { describe, expect, test } from "vitest"

import {
  deriveDocumentColumns,
  formatDocumentCellValue,
  getDocumentIdentifier,
} from "@/lib/meili/documents"

describe("document helpers", () => {
  test("prioritizes the primary key and derives top-level columns from the current page", () => {
    const columns = deriveDocumentColumns(
      [
        { id: 1, title: "One", nested: { rank: 1 } },
        { id: 2, category: "books", title: "Two" },
      ],
      "id"
    )

    expect(columns).toEqual(["id", "category", "nested", "title"])
  })

  test("formats nested values as compact JSON strings", () => {
    expect(formatDocumentCellValue({ rank: 1, tags: ["a"] })).toBe(
      '{"rank":1,"tags":["a"]}'
    )
    expect(formatDocumentCellValue(["a", "b"])).toBe('["a","b"]')
    expect(formatDocumentCellValue("hello")).toBe("hello")
    expect(formatDocumentCellValue(null)).toBe("null")
  })

  test("extracts the current document identifier only when the primary key is present", () => {
    expect(getDocumentIdentifier({ id: "abc", title: "Hello" }, "id")).toBe(
      "abc"
    )
    expect(getDocumentIdentifier({ title: "Hello" }, "id")).toBeNull()
  })
})
