"use client"

import { useEffect, useState } from "react"
import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import {
  BoxesIcon,
  ChevronLeftIcon,
  FileJsonIcon,
  ListTodoIcon,
  RefreshCcwIcon,
} from "lucide-react"

import type { IndexSummary } from "@/lib/meili/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { checkInstanceConnection, listIndexes } from "@/lib/meili/api"
import { useSavedInstances } from "@/lib/meili/use-saved-instances"

export const Route = createFileRoute("/instances/$instanceId")({
  component: InstanceOverviewPage,
})

function InstanceOverviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { instanceId } = Route.useParams()
  const { getInstance, isHydrated, selectInstance } = useSavedInstances()
  const instance = getInstance(instanceId)
  const isOverview = location.pathname === `/instances/${instanceId}`
  const [indexes, setIndexes] = useState<Array<IndexSummary>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [packageVersion, setPackageVersion] = useState<string | null>(null)

  useEffect(() => {
    if (!isOverview || !instance) {
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

    async function load() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const [connection, nextIndexes] = await Promise.all([
          checkInstanceConnection(currentInstance),
          listIndexes(currentInstance),
        ])

        if (!isMounted) {
          return
        }

        setIndexes(nextIndexes)
        setPackageVersion(connection.packageVersion)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Unknown error"
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [instance, isOverview])

  if (!isOverview) {
    return <Outlet />
  }

  return (
    <main className="flex min-h-svh justify-center p-6">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => void navigate({ to: "/" })}
              type="button"
              variant="secondary"
            >
              <ChevronLeftIcon data-icon="inline-start" />
              Back to instances
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold">
                {instance?.name ?? "Unknown instance"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {instance?.host ?? "Saved instance not found"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {packageVersion ? (
              <Badge variant="secondary">v{packageVersion}</Badge>
            ) : null}
            <Button
              onClick={() =>
                void navigate({
                  params: { instanceId },
                  to: "/instances/$instanceId/tasks",
                })
              }
              type="button"
              variant="outline"
            >
              <ListTodoIcon data-icon="inline-start" />
              Tasks
            </Button>
            <Button
              onClick={() => window.location.reload()}
              type="button"
              variant="outline"
            >
              <RefreshCcwIcon data-icon="inline-start" />
              Refresh
            </Button>
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
              The instance may have been removed from localStorage. Go back to
              the root page and add it again.
            </AlertDescription>
          </Alert>
        ) : null}

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to connect</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {instance && !isLoading && indexes.length === 0 && !errorMessage ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BoxesIcon />
              </EmptyMedia>
              <EmptyTitle>No indexes found</EmptyTitle>
              <EmptyDescription>
                This instance connected successfully but did not return any
                indexes.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {instance && indexes.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {indexes.map((index) => (
              <Card key={index.uid}>
                <CardHeader>
                  <CardTitle>{index.uid}</CardTitle>
                  <CardDescription>
                    Primary key: {index.primaryKey ?? "Not configured"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Updated{" "}
                      {index.updatedAt
                        ? new Date(index.updatedAt).toLocaleString()
                        : "unknown"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      void navigate({
                        params: { indexUid: index.uid, instanceId },
                        search: {
                          limit: 20,
                          page: 1,
                          query: "",
                          view: "table",
                        },
                        to: "/instances/$instanceId/indexes/$indexUid/documents",
                      })
                    }
                    type="button"
                  >
                    Documents
                  </Button>
                  <Button
                    onClick={() =>
                      void navigate({
                        params: { indexUid: index.uid, instanceId },
                        to: "/instances/$instanceId/indexes/$indexUid/settings",
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    <FileJsonIcon data-icon="inline-start" />
                    Settings
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}
