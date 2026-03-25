import { MeiliSearch } from "meilisearch"
import type {
  EnqueuedTask,
  Settings,
  Task,
  TaskStatus,
  TaskType,
} from "meilisearch"

import type { CreateIndexInput } from "@/lib/meili/indexes"
import type { SavedInstance } from "@/lib/meili/types"

export type DocumentRecord = Record<string, unknown>

export type IndexSummary = {
  uid: string
  primaryKey: string | null
  createdAt?: string
  updatedAt?: string
}

export type DocumentsPage = {
  documents: Array<DocumentRecord>
  limit: number
  offset: number
  primaryKey: string | null
  raw: unknown
  total: number
}

export type InstanceConnection = {
  host: string
  packageVersion: string
}

type TaskFilters = {
  indexUid?: string
  limit?: number
  statuses?: Array<TaskStatus>
  types?: Array<TaskType>
}

type DocumentsFilters = {
  limit: number
  offset: number
  query: string
}

function createClient(instance: SavedInstance) {
  return new MeiliSearch({
    apiKey: instance.apiKey,
    host: instance.host,
  })
}

export async function checkInstanceConnection(
  instance: SavedInstance
): Promise<InstanceConnection> {
  const client = createClient(instance)
  const version = await client.getVersion()

  return {
    host: instance.host,
    packageVersion: version.pkgVersion,
  }
}

export async function listIndexes(
  instance: SavedInstance
): Promise<Array<IndexSummary>> {
  const client = createClient(instance)
  const response = await client.getRawIndexes({ limit: 100 })

  return response.results.map((index) => ({
    createdAt: index.createdAt,
    primaryKey: index.primaryKey ?? null,
    uid: index.uid,
    updatedAt: index.updatedAt,
  }))
}

export async function createIndex(
  instance: SavedInstance,
  input: CreateIndexInput
): Promise<EnqueuedTask> {
  return await createClient(instance).createIndex(
    input.uid,
    input.primaryKey ? { primaryKey: input.primaryKey } : undefined
  )
}

export async function listDocuments(
  instance: SavedInstance,
  indexUid: string,
  filters: DocumentsFilters
): Promise<DocumentsPage> {
  const client = createClient(instance)
  const index = await client.getRawIndex(indexUid)
  const runtimeIndex = client.index<DocumentRecord>(indexUid)

  if (filters.query.trim()) {
    const response = await runtimeIndex.search(filters.query.trim(), {
      hitsPerPage: filters.limit,
      page: Math.floor(filters.offset / filters.limit) + 1,
    })
    const responseWithTotals = response as typeof response & {
      estimatedTotalHits?: number
    }

    return {
      documents: response.hits,
      limit: response.hitsPerPage,
      offset:
        response.page && response.hitsPerPage
          ? (response.page - 1) * response.hitsPerPage
          : filters.offset,
      primaryKey: index.primaryKey ?? null,
      raw: response,
      total: responseWithTotals.estimatedTotalHits ?? response.hits.length,
    }
  }

  const response = await runtimeIndex.getDocuments({
    limit: filters.limit,
    offset: filters.offset,
  })

  return {
    documents: response.results,
    limit: response.limit ?? filters.limit,
    offset: response.offset ?? filters.offset,
      primaryKey: index.primaryKey ?? null,
      raw: response,
      total: response.total,
    }
}

export async function getDocument(
  instance: SavedInstance,
  indexUid: string,
  documentId: string
) {
  return await createClient(instance)
    .index<DocumentRecord>(indexUid)
    .getDocument(documentId)
}

export async function upsertDocument(
  instance: SavedInstance,
  indexUid: string,
  document: DocumentRecord
): Promise<EnqueuedTask> {
  return await createClient(instance)
    .index<DocumentRecord>(indexUid)
    .updateDocuments([document])
}

export async function deleteDocument(
  instance: SavedInstance,
  indexUid: string,
  documentId: string
): Promise<EnqueuedTask> {
  return await createClient(instance).index(indexUid).deleteDocument(documentId)
}

export async function getIndexSettings(
  instance: SavedInstance,
  indexUid: string
): Promise<Settings> {
  return await createClient(instance).index(indexUid).getSettings()
}

export async function updateIndexSettings(
  instance: SavedInstance,
  indexUid: string,
  settings: Settings
): Promise<EnqueuedTask> {
  return await createClient(instance).index(indexUid).updateSettings(settings)
}

export async function listTasks(
  instance: SavedInstance,
  filters: TaskFilters
): Promise<Array<Task>> {
  const client = createClient(instance)
  const response = await client.tasks.getTasks({
    indexUids: filters.indexUid ? [filters.indexUid] : undefined,
    limit: filters.limit ?? 20,
    statuses: filters.statuses,
    types: filters.types,
  })

  return response.results
}
