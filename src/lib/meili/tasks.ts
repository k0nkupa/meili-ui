export type TaskRecord = Record<string, unknown>

export function reconcileSelectedTask(
  selectedTask: TaskRecord | null,
  refreshedTasks: Array<TaskRecord>
): TaskRecord | null {
  if (!selectedTask) {
    return null
  }

  return refreshedTasks.find(({ uid }) => uid === selectedTask.uid) ?? null
}
