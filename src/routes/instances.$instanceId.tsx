"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import {
  BoxesIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  FileJsonIcon,
  ListTodoIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
} from "lucide-react"

import type { IndexSummary } from "@/lib/meili/api"
import type { CreateIndexInput } from "@/lib/meili/indexes"
import type {
  IndexOverviewRouteSearch,
  IndexOverviewSearch,
} from "@/lib/meili/index-overview"
import type { SavedInstance } from "@/lib/meili/types"
import {
  DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH,
  buildIndexOverview,
  getIndexGroupKey,
  normalizeIndexOverviewRouteSearch,
  toIndexOverviewSearch,
} from "@/lib/meili/index-overview"
import { CreateIndexDialog } from "@/features/meili/create-index-dialog"
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  checkInstanceConnection,
  createIndex,
  listIndexes,
} from "@/lib/meili/api"
import { useSavedInstances } from "@/lib/meili/use-saved-instances"

type InstanceOverviewSearchInput = {
  indexGroup?: string
  indexQuery?: string
  indexSort?: string
}

export const Route = createFileRoute("/instances/$instanceId")({
  component: InstanceOverviewPage,
  validateSearch: (
    search: InstanceOverviewSearchInput
  ): IndexOverviewRouteSearch => normalizeIndexOverviewRouteSearch(search),
})

async function loadInstanceOverview(instance: SavedInstance): Promise<{
  indexes: Array<IndexSummary>
  packageVersion: string
}> {
  const [connection, indexes] = await Promise.all([
    checkInstanceConnection(instance),
    listIndexes(instance),
  ])

  return {
    indexes,
    packageVersion: connection.packageVersion,
  }
}

function InstanceOverviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { instanceId } = Route.useParams()
  const routeSearch = Route.useSearch()
  const search = useMemo(
    () => toIndexOverviewSearch(routeSearch),
    [routeSearch]
  )
  const { getInstance, isHydrated, selectInstance } = useSavedInstances()
  const instance = getInstance(instanceId)
  const isOverview = location.pathname === `/instances/${instanceId}`
  const [indexes, setIndexes] = useState<Array<IndexSummary>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [packageVersion, setPackageVersion] = useState<string | null>(null)
  const [createIndexOpen, setCreateIndexOpen] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  )

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
        const overview = await loadInstanceOverview(currentInstance)

        if (!isMounted) {
          return
        }

        setIndexes(overview.indexes)
        setPackageVersion(overview.packageVersion)
        setLastRefreshedAt(new Date().toISOString())
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

  async function handleCreateIndex(input: CreateIndexInput) {
    if (!instance) {
      return
    }

    const task = await createIndex(instance, input)
    const overview = await loadInstanceOverview(instance)

    setIndexes(overview.indexes)
    setPackageVersion(overview.packageVersion)
    setErrorMessage(null)
    setLastRefreshedAt(new Date().toISOString())
    setResultMessage(`Index creation enqueued as task ${task.taskUid}.`)
  }

  const groupOptions = useMemo(
    () =>
      Array.from(
        new Set(indexes.map((index) => getIndexGroupKey(index.uid)))
      ).sort((left, right) => left.localeCompare(right)),
    [indexes]
  )

  const overview = useMemo(
    () => buildIndexOverview(indexes, search),
    [indexes, search]
  )

  useEffect(() => {
    if (groupOptions.length === 0) {
      setExpandedGroups({})
      return
    }

    setExpandedGroups((current) => {
      const nextState = { ...current }

      for (const group of groupOptions) {
        if (typeof nextState[group] !== "boolean") {
          nextState[group] = true
        }
      }

      return nextState
    })
  }, [groupOptions])

  function updateSearch(nextSearch: Partial<IndexOverviewSearch>) {
    void navigate({
      params: { instanceId },
      replace: true,
      search: {
        ...routeSearch,
        indexGroup: nextSearch.group ?? routeSearch.indexGroup,
        indexQuery: nextSearch.query ?? routeSearch.indexQuery,
        indexSort: nextSearch.sort ?? routeSearch.indexSort,
      },
      to: "/instances/$instanceId",
    })
  }

  function setGroupExpanded(groupKey: string, open: boolean) {
    setExpandedGroups((current) => ({
      ...current,
      [groupKey]: open,
    }))
  }

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
              disabled={!instance}
              onClick={() => setCreateIndexOpen(true)}
              type="button"
            >
              <PlusIcon data-icon="inline-start" />
              Create index
            </Button>
            <Button
              onClick={() =>
                void navigate({
                  params: { instanceId },
                  search: DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH,
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

        {resultMessage ? (
          <Alert>
            <AlertTitle>Index creation enqueued</AlertTitle>
            <AlertDescription>{resultMessage}</AlertDescription>
          </Alert>
        ) : null}

        {instance && indexes.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="gap-1">
                  <CardDescription>Total indexes</CardDescription>
                  <CardTitle className="text-3xl">
                    {overview.totalIndexes}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="gap-1">
                  <CardDescription>Groups</CardDescription>
                  <CardTitle className="text-3xl">
                    {overview.groups.length}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      visible / {groupOptions.length} total
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="gap-1">
                  <CardDescription>Last refreshed</CardDescription>
                  <CardTitle className="text-base font-medium">
                    {lastRefreshedAt
                      ? new Date(lastRefreshedAt).toLocaleString()
                      : "Not yet"}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="sticky top-4 z-10 border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <CardHeader className="gap-1">
                <CardTitle>Index inventory</CardTitle>
                <CardDescription>
                  Search, filter, and open indexes without making the page look
                  like a Pinterest board for infrastructure.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)_minmax(220px,1fr)]">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Search</span>
                    <div className="relative">
                      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        onChange={(event) =>
                          updateSearch({
                            query: event.target.value,
                          })
                        }
                        placeholder="Search by UID or primary key"
                        value={routeSearch.indexQuery}
                      />
                    </div>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Group</span>
                    <Select
                      onValueChange={(value) =>
                        updateSearch({
                          group:
                            value ??
                            DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH.indexGroup,
                        })
                      }
                      value={routeSearch.indexGroup}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All groups" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All groups</SelectItem>
                        {groupOptions.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Sort</span>
                    <Select
                      onValueChange={(value) =>
                        updateSearch({
                          sort:
                            value ??
                            DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH.indexSort,
                        })
                      }
                      value={routeSearch.indexSort}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort indexes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updated-desc">
                          Updated newest first
                        </SelectItem>
                        <SelectItem value="updated-asc">
                          Updated oldest first
                        </SelectItem>
                        <SelectItem value="uid-asc">UID A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                </div>

                <p className="text-sm text-muted-foreground">
                  Showing {overview.filteredIndexes} of {overview.totalIndexes}{" "}
                  indexes.
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}

        {instance && isLoading && indexes.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Refreshing index inventory...
              </p>
            </CardContent>
          </Card>
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

        {instance && indexes.length > 0 && overview.filteredIndexes === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>No matching indexes</EmptyTitle>
              <EmptyDescription>
                Your filters are too specific. The UI is not wrong just because
                it obeyed them.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {instance && overview.filteredIndexes > 0 ? (
          <div className="flex flex-col gap-4">
            {overview.groups.map((group) => {
              const isOpen = expandedGroups[group.key] ?? true

              return (
                <Collapsible
                  key={group.key}
                  onOpenChange={(open) => setGroupExpanded(group.key, open)}
                  open={isOpen}
                >
                  <Card>
                    <CardHeader className="gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{group.key}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {group.indexes.length} index
                              {group.indexes.length === 1 ? "" : "es"}
                            </span>
                            <Badge variant="outline">
                              Latest update{" "}
                              {group.latestUpdatedAt
                                ? new Date(
                                    group.latestUpdatedAt
                                  ).toLocaleString()
                                : "unknown"}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">
                            {group.key} indexes
                          </CardTitle>
                          <CardDescription>
                            Fast path for the indexes that share the same UID
                            family.
                          </CardDescription>
                        </div>

                        <CollapsibleTrigger
                          render={<Button type="button" variant="outline" />}
                        >
                          <ChevronDownIcon
                            className={`transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                            data-icon="inline-start"
                          />
                          {isOpen ? "Collapse" : "Expand"}
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="flex flex-col gap-3">
                        {group.indexes.map((index) => (
                          <div
                            className="rounded-lg border border-border/70 p-4"
                            key={index.uid}
                          >
                            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {index.uid}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  UID family {index.groupKey}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm font-medium">
                                  Primary key
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {index.primaryKey ?? "Not configured"}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm font-medium">Updated</p>
                                <p className="text-sm text-muted-foreground">
                                  {index.updatedAt
                                    ? new Date(index.updatedAt).toLocaleString()
                                    : "unknown"}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 lg:justify-end">
                                <Button
                                  onClick={() =>
                                    void navigate({
                                      params: {
                                        indexUid: index.uid,
                                        instanceId,
                                      },
                                      search: {
                                        ...routeSearch,
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
                                      params: {
                                        indexUid: index.uid,
                                        instanceId,
                                      },
                                      search: routeSearch,
                                      to: "/instances/$instanceId/indexes/$indexUid/settings",
                                    })
                                  }
                                  type="button"
                                  variant="outline"
                                >
                                  <FileJsonIcon data-icon="inline-start" />
                                  Settings
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>
        ) : null}

        {instance ? (
          <CreateIndexDialog
            onOpenChange={setCreateIndexOpen}
            onSubmit={handleCreateIndex}
            open={createIndexOpen}
          />
        ) : null}
      </div>
    </main>
  )
}
