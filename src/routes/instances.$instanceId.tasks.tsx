"use client"

import { useEffect, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ChevronLeftIcon } from "lucide-react"

import type { ComponentProps } from "react"
import type { TaskStatus, TaskType } from "meilisearch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listTasks } from "@/lib/meili/api"
import { useSavedInstances } from "@/lib/meili/use-saved-instances"

export const Route = createFileRoute("/instances/$instanceId/tasks")({
  component: TasksPage,
})

function TasksPage() {
  const navigate = useNavigate()
  const { instanceId } = Route.useParams()
  const { getInstance, isHydrated, selectInstance } = useSavedInstances()
  const instance = getInstance(instanceId)
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [indexFilter, setIndexFilter] = useState("")
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([])
  const [selectedTask, setSelectedTask] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!instance) {
      return
    }

    selectInstance(instance.id)
  }, [instance, selectInstance])

  useEffect(() => {
    if (!instance) {
      return
    }

    const currentInstance = instance
    let isMounted = true

    async function loadTasks() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await listTasks(currentInstance, {
          indexUid: indexFilter || undefined,
          limit: 20,
          statuses: statusFilter
            ? ([statusFilter] as Array<TaskStatus>)
            : undefined,
          types: typeFilter ? ([typeFilter] as Array<TaskType>) : undefined,
        })

        if (isMounted) {
          setTasks(response as Array<Record<string, unknown>>)
          setSelectedTask((current) =>
            current
              ? ((response as Array<Record<string, unknown>>).find(
                  ({ uid }) => uid === current.uid
                ) ?? null)
              : null
          )
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unknown error"
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadTasks()

    return () => {
      isMounted = false
    }
  }, [indexFilter, instance, statusFilter, typeFilter])

  return (
    <main className="flex min-h-svh justify-center p-6">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Button
            onClick={() =>
              void navigate({
                params: { instanceId },
                to: "/instances/$instanceId",
              })
            }
            type="button"
            variant="secondary"
          >
            <ChevronLeftIcon data-icon="inline-start" />
            Back to instance
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Inspect recent tasks for{" "}
              {instance?.name ?? "the selected instance"}.
            </p>
          </div>
        </div>

        {!isHydrated ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Loading instance...
              </p>
            </CardContent>
          </Card>
        ) : null}

        {isHydrated && !instance ? (
          <Alert variant="destructive">
            <AlertTitle>Saved instance not found</AlertTitle>
            <AlertDescription>
              Go back to the root page and add the instance again.
            </AlertDescription>
          </Alert>
        ) : null}

        {instance ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>
                  Keep these simple. This phase is read-only, not a task-control
                  center.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="tasks-status">Status</FieldLabel>
                    <Input
                      id="tasks-status"
                      onChange={(event) => setStatusFilter(event.target.value)}
                      placeholder="enqueued"
                      value={statusFilter}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tasks-type">Type</FieldLabel>
                    <Input
                      id="tasks-type"
                      onChange={(event) => setTypeFilter(event.target.value)}
                      placeholder="documentAdditionOrUpdate"
                      value={typeFilter}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tasks-index">Index UID</FieldLabel>
                    <Input
                      id="tasks-index"
                      onChange={(event) => setIndexFilter(event.target.value)}
                      placeholder="products"
                      value={indexFilter}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to load tasks</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Recent tasks</CardTitle>
                  <CardDescription>
                    {isLoading
                      ? "Loading tasks..."
                      : `${tasks.length} task(s) loaded`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>UID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Index</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={String(task.uid ?? Math.random())}>
                          <TableCell>{String(task.uid ?? "-")}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getTaskStatusBadgeVariant(
                                task.status as TaskStatus | undefined
                              )}
                            >
                              {String(task.status ?? "unknown")}
                            </Badge>
                          </TableCell>
                          <TableCell>{String(task.type ?? "-")}</TableCell>
                          <TableCell>{String(task.indexUid ?? "-")}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => setSelectedTask(task)}
                              type="button"
                              variant="outline"
                            >
                              View raw
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Raw task JSON</CardTitle>
                  <CardDescription>
                    Select a task to inspect the unfiltered payload.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[32rem] rounded-md border">
                    <pre className="p-4 text-xs leading-6 whitespace-pre-wrap">
                      {selectedTask
                        ? JSON.stringify(selectedTask, null, 2)
                        : "Select a task row to inspect its JSON payload."}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}

function getTaskStatusBadgeVariant(
  status: TaskStatus | undefined
): ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "succeeded":
      return "secondary"
    case "processing":
      return "default"
    case "failed":
    case "canceled":
      return "destructive"
    case "enqueued":
      return "outline"
    default:
      return "ghost"
  }
}
