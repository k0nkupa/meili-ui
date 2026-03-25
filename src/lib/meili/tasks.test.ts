import { describe, expect, test } from "vitest"

import { reconcileSelectedTask } from "@/lib/meili/tasks"

describe("task helpers", () => {
  test("keeps the selected task when the same UID is present after refresh", () => {
    const selectedTask = { status: "processing", uid: 12 }
    const refreshedTasks = [
      { status: "processing", uid: 12 },
      { status: "succeeded", uid: 13 },
    ]

    expect(reconcileSelectedTask(selectedTask, refreshedTasks)).toEqual({
      status: "processing",
      uid: 12,
    })
  })

  test("clears the selected task when its UID is no longer present", () => {
    const selectedTask = { status: "processing", uid: 12 }
    const refreshedTasks = [{ status: "succeeded", uid: 13 }]

    expect(reconcileSelectedTask(selectedTask, refreshedTasks)).toBeNull()
  })
})
