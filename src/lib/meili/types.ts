export type SavedInstance = {
  id: string
  name: string
  host: string
  apiKey: string
  createdAt: string
  updatedAt: string
}

export type SavedInstancesState = {
  instances: Array<SavedInstance>
  lastSelectedInstanceId: string | null
}
