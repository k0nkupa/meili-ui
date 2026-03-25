export type CreateIndexInput = {
  uid: string
  primaryKey?: string
}

const INDEX_UID_PATTERN = /^[A-Za-z0-9_-]+$/

export function normalizeCreateIndexInput(
  input: CreateIndexInput
): CreateIndexInput {
  const uid = input.uid.trim()
  const primaryKey = input.primaryKey?.trim()

  return {
    ...(primaryKey ? { primaryKey } : {}),
    uid,
  }
}

export function getCreateIndexUidError(uid: string): string | null {
  const trimmedUid = uid.trim()

  if (!trimmedUid) {
    return "Index UID is required."
  }

  if (!INDEX_UID_PATTERN.test(trimmedUid)) {
    return "Index UID can only contain letters, numbers, hyphens, and underscores."
  }

  return null
}
