import { describe, expect, test } from "vitest"

import {
  getCreateIndexUidError,
  normalizeCreateIndexInput,
} from "@/lib/meili/indexes"

describe("index helpers", () => {
  test("normalizes create-index input and omits a blank primary key", () => {
    expect(
      normalizeCreateIndexInput({
        primaryKey: "   ",
        uid: " movies_v2 ",
      })
    ).toEqual({
      uid: "movies_v2",
    })
  })

  test("trims and keeps a provided primary key", () => {
    expect(
      normalizeCreateIndexInput({
        primaryKey: " id ",
        uid: " products ",
      })
    ).toEqual({
      primaryKey: "id",
      uid: "products",
    })
  })

  test("rejects empty or invalid index UIDs", () => {
    expect(getCreateIndexUidError("")).toBe("Index UID is required.")
    expect(getCreateIndexUidError("   ")).toBe("Index UID is required.")
    expect(getCreateIndexUidError("movies v2")).toBe(
      "Index UID can only contain letters, numbers, hyphens, and underscores."
    )
    expect(getCreateIndexUidError("movies@prod")).toBe(
      "Index UID can only contain letters, numbers, hyphens, and underscores."
    )
  })

  test("accepts valid index UIDs", () => {
    expect(getCreateIndexUidError("movies")).toBeNull()
    expect(getCreateIndexUidError("tenant-1")).toBeNull()
    expect(getCreateIndexUidError("products_v2")).toBeNull()
  })
})
