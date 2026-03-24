// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test } from "vitest"

import {
  DocumentRawJsonView,
  DocumentValueCell,
} from "@/features/meili/document-viewers"

afterEach(() => {
  cleanup()
})

describe("document viewers", () => {
  test("renders metadata and one raw JSON card per document", () => {
    render(
      <DocumentRawJsonView
        documents={[
          { id: "alpha", title: "Hello", tags: ["one"] },
          { id: "beta", title: "World", published: true },
        ]}
        metadata={[
          { label: "Primary key", value: "id" },
          { label: "Result window", value: "2" },
          { label: "Total matches", value: "25" },
        ]}
        primaryKey="id"
      />
    )

    screen.getByText("Primary key")
    screen.getByText("Result window")
    screen.getByText("Total matches")
    screen.getByText("Document alpha")
    screen.getByText("Document beta")
    screen.getByText(/"title": "Hello"/)
    screen.getByText(/"published": true/)
  })

  test("shows an empty state when the current result window has no documents", () => {
    render(
      <DocumentRawJsonView
        documents={[]}
        metadata={[{ label: "Result window", value: "0" }]}
        primaryKey="id"
      />
    )

    screen.getByText("No documents in the current result window.")
  })

  test("truncates long table values while preserving the full title", () => {
    const longValue = "x".repeat(120)
    render(<DocumentValueCell value={longValue} />)

    const cell = screen.getByText(longValue)

    expect(cell.className).toContain("truncate")
    expect(cell.getAttribute("title")).toBe(longValue)
  })
})
