import type { SavedInstance, SavedInstancesState } from "@/lib/meili/types"

const STORAGE_KEY = "meili-ui.instances.v1"

export function getInstanceHostError(host: string): string | null {
  const trimmedHost = host.trim()

  if (!trimmedHost) {
    return "Host URL is required."
  }

  let url: URL

  try {
    url = new URL(trimmedHost)
  } catch {
    return "Host must be a valid URL."
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Host must use http or https."
  }

  if (url.username || url.password) {
    return "Host must not include credentials."
  }

  if (url.search || url.hash) {
    return "Host must not include query strings or fragments."
  }

  return null
}

export function normalizeInstanceHost(host: string) {
  const error = getInstanceHostError(host)

  if (error) {
    throw new Error(error)
  }

  return host.trim().replace(/\/+$/, "")
}

export function createSavedInstance(input: {
  name: string
  host: string
  apiKey: string
}): SavedInstance {
  const timestamp = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    host: normalizeInstanceHost(input.host),
    apiKey: input.apiKey.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function loadSavedInstancesState(): SavedInstancesState {
  if (typeof localStorage === "undefined") {
    return { instances: [], lastSelectedInstanceId: null }
  }

  const rawValue = localStorage.getItem(STORAGE_KEY)

  if (!rawValue) {
    return { instances: [], lastSelectedInstanceId: null }
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SavedInstancesState>
    const instances = Array.isArray(parsed.instances) ? parsed.instances : []
    const lastSelectedInstanceId =
      typeof parsed.lastSelectedInstanceId === "string"
        ? parsed.lastSelectedInstanceId
        : null

    return { instances, lastSelectedInstanceId }
  } catch {
    return { instances: [], lastSelectedInstanceId: null }
  }
}

export function saveSavedInstancesState(state: SavedInstancesState) {
  if (typeof localStorage === "undefined") {
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function upsertSavedInstance(
  state: SavedInstancesState,
  instance: SavedInstance
): SavedInstancesState {
  const normalizedInstance = {
    ...instance,
    name: instance.name.trim(),
    host: normalizeInstanceHost(instance.host),
    apiKey: instance.apiKey.trim(),
    updatedAt: new Date().toISOString(),
  }
  const existingIndex = state.instances.findIndex(
    ({ id }) => id === normalizedInstance.id
  )
  const instances = [...state.instances]

  if (existingIndex >= 0) {
    instances[existingIndex] = {
      ...instances[existingIndex],
      ...normalizedInstance,
      createdAt: instances[existingIndex].createdAt,
    }
  } else {
    instances.push(normalizedInstance)
  }

  return {
    instances,
    lastSelectedInstanceId: normalizedInstance.id,
  }
}

export function removeSavedInstance(
  state: SavedInstancesState,
  instanceId: string
): SavedInstancesState {
  const instances = state.instances.filter(({ id }) => id !== instanceId)

  if (state.lastSelectedInstanceId !== instanceId) {
    return {
      instances,
      lastSelectedInstanceId: state.lastSelectedInstanceId,
    }
  }

  return {
    instances,
    lastSelectedInstanceId: instances[0]?.id ?? null,
  }
}
