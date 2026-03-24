export function deriveDocumentColumns(
  documents: Array<Record<string, unknown>>,
  primaryKey: string | null
) {
  const keys = new Set<string>()

  for (const document of documents) {
    for (const key of Object.keys(document)) {
      if (key !== primaryKey) {
        keys.add(key)
      }
    }
  }

  return primaryKey
    ? [primaryKey, ...Array.from(keys).sort()]
    : Array.from(keys)
}

export function formatDocumentCellValue(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return String(value)
  }

  if (typeof value === "undefined") {
    return ""
  }

  return JSON.stringify(value)
}

export function getDocumentIdentifier(
  document: Record<string, unknown>,
  primaryKey: string | null
) {
  if (!primaryKey) {
    return null
  }

  const value = document[primaryKey]

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value)
  }

  return null
}
