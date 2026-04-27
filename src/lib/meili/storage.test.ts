import { beforeEach, describe, expect, test, vi } from "vitest"

import {
  createSavedInstance,
  getInstanceHostError,
  loadSavedInstancesState,
  removeSavedInstance,
  saveSavedInstancesState,
  upsertSavedInstance,
} from "@/lib/meili/storage"

function createLocalStorageMock() {
  let storage = new Map<string, string>()

  return {
    clear: vi.fn(() => {
      storage = new Map<string, string>()
    }),
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      storage.delete(key)
    }),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value)
    }),
    get length() {
      return storage.size
    },
  }
}

describe("saved instance storage", () => {
  const localStorageMock = createLocalStorageMock()

  beforeEach(() => {
    localStorageMock.clear()
    vi.stubGlobal("localStorage", localStorageMock)
  })

  test("creates normalized saved instances", () => {
    const instance = createSavedInstance({
      apiKey: "masterKey",
      host: " https://search.example.com/ ",
      name: "Production",
    })

    expect(instance.id).toBeTypeOf("string")
    expect(instance.host).toBe("https://search.example.com")
    expect(instance.name).toBe("Production")
    expect(instance.apiKey).toBe("masterKey")
    expect(instance.createdAt).toBe(instance.updatedAt)
  })

  test("rejects unsafe saved instance host values", () => {
    expect(getInstanceHostError("")).toBe("Host URL is required.")
    expect(getInstanceHostError("search.example.com")).toBe(
      "Host must be a valid URL."
    )
    expect(getInstanceHostError("ftp://search.example.com")).toBe(
      "Host must use http or https."
    )
    expect(getInstanceHostError("https://user:pass@search.example.com")).toBe(
      "Host must not include credentials."
    )
    expect(getInstanceHostError("https://search.example.com/?key=value")).toBe(
      "Host must not include query strings or fragments."
    )
  })

  test("persists and reloads state from localStorage", () => {
    const alpha = createSavedInstance({
      apiKey: "alpha-key",
      host: "https://alpha.example.com/",
      name: "Alpha",
    })
    const beta = createSavedInstance({
      apiKey: "beta-key",
      host: "https://beta.example.com",
      name: "Beta",
    })

    saveSavedInstancesState({
      instances: [alpha, beta],
      lastSelectedInstanceId: beta.id,
    })

    expect(loadSavedInstancesState()).toEqual({
      instances: [alpha, beta],
      lastSelectedInstanceId: beta.id,
    })
  })

  test("upserts and reselects edited instances", () => {
    const state = loadSavedInstancesState()
    const alpha = createSavedInstance({
      apiKey: "alpha-key",
      host: "https://alpha.example.com",
      name: "Alpha",
    })

    const withAlpha = upsertSavedInstance(state, alpha)
    const edited = {
      ...alpha,
      host: "https://alpha.internal.example.com/",
      name: "Alpha Internal",
    }

    const withEdit = upsertSavedInstance(withAlpha, edited)

    expect(withEdit.instances).toHaveLength(1)
    expect(withEdit.instances[0]).toMatchObject({
      host: "https://alpha.internal.example.com",
      name: "Alpha Internal",
    })
    expect(withEdit.lastSelectedInstanceId).toBe(alpha.id)
  })

  test("removes saved instances and clears selection when needed", () => {
    const alpha = createSavedInstance({
      apiKey: "alpha-key",
      host: "https://alpha.example.com",
      name: "Alpha",
    })
    const beta = createSavedInstance({
      apiKey: "beta-key",
      host: "https://beta.example.com",
      name: "Beta",
    })

    const state = {
      instances: [alpha, beta],
      lastSelectedInstanceId: alpha.id,
    }

    expect(removeSavedInstance(state, beta.id)).toEqual({
      instances: [alpha],
      lastSelectedInstanceId: alpha.id,
    })

    expect(removeSavedInstance(state, alpha.id)).toEqual({
      instances: [beta],
      lastSelectedInstanceId: beta.id,
    })
  })
})
