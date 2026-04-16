"use client"

import { useEffect, useMemo, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ListTodoIcon,
  RefreshCcwIcon,
} from "lucide-react"

import type { DocumentRecord } from "@/lib/meili/api"
import {
  normalizeDocumentsSearch,
  sortDocuments,
} from "@/features/meili/documents-table-state"
import {
  DocumentRawJsonView,
  DocumentValueCell,
} from "@/features/meili/document-viewers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteDocument,
  getDocument,
  listDocuments,
  upsertDocument,
} from "@/lib/meili/api"
import {
  deriveDocumentColumns,
  getDocumentIdentifier,
} from "@/lib/meili/documents"
import { useSavedInstances } from "@/lib/meili/use-saved-instances"

type NormalizedDocumentsSearch = ReturnType<typeof normalizeDocumentsSearch>
type DocumentsSearch = Partial<NormalizedDocumentsSearch & Record<string, unknown>>
type DocumentsRouteSearch = Omit<NormalizedDocumentsSearch, "sortBy" | "sortDir"> & {
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export const Route = createFileRoute(
  "/instances/$instanceId/indexes/$indexUid/documents"
)({
  component: DocumentsPage,
  validateSearch: (search: DocumentsSearch): DocumentsRouteSearch =>
    normalizeDocumentsSearch(search),
})

function DocumentsPage() {
  const navigate = useNavigate()
  const { indexUid, instanceId } = Route.useParams()
  const search = Route.useSearch()
  const { getInstance, isHydrated, selectInstance } = useSavedInstances()
  const instance = getInstance(instanceId)
  const [documents, setDocuments] = useState<Array<DocumentRecord>>([])
  const [primaryKey, setPrimaryKey] = useState<string | null>(null)
  const [rawPayload, setRawPayload] = useState<unknown>(null)
  const [total, setTotal] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [queryInput, setQueryInput] = useState(search.query)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorValue, setEditorValue] = useState("{}")
  const [editorTitle, setEditorTitle] = useState("Create document")
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    setQueryInput(search.query)
  }, [search.query])

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
    const offset = (search.page - 1) * search.limit

    async function loadDocuments() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await listDocuments(currentInstance, indexUid, {
          limit: search.limit,
          offset,
          query: search.query,
        })

        if (!isMounted) {
          return
        }

        setDocuments(response.documents)
        setPrimaryKey(response.primaryKey)
        setRawPayload(response.raw)
        setTotal(response.total)
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

    void loadDocuments()

    return () => {
      isMounted = false
    }
  }, [indexUid, instance, refreshNonce, search.limit, search.page, search.query])

  const columns = useMemo(
    () => deriveDocumentColumns(documents, primaryKey),
    [documents, primaryKey]
  )
  const sortedDocuments = useMemo(
    () => sortDocuments(documents, search.sortBy ?? "", search.sortDir ?? "asc"),
    [documents, search.sortBy, search.sortDir]
  )
  const rawMetadata = useMemo(() => {
    const metadata = [
      { label: "Primary key", value: primaryKey ?? "Not configured" },
      { label: "Result window", value: String(documents.length) },
      { label: "Total matches", value: String(total) },
      { label: "Page", value: String(search.page) },
      { label: "Limit", value: String(search.limit) },
    ]
    const payload = isRecord(rawPayload) ? rawPayload : null
    const processingTimeMs = getNumericField(payload, "processingTimeMs")

    if (search.query.trim()) {
      metadata.unshift({
        label: "Query",
        value: search.query.trim(),
      })
    } else {
      metadata.push({
        label: "Offset",
        value: String((search.page - 1) * search.limit),
      })
    }

    if (processingTimeMs !== null) {
      metadata.push({
        label: "Processing time",
        value: `${processingTimeMs} ms`,
      })
    }

    return metadata
  }, [
    documents.length,
    primaryKey,
    rawPayload,
    search.limit,
    search.page,
    search.query,
    total,
  ])
  const totalPages = Math.max(1, Math.ceil(total / search.limit))

  function updateSearch(nextSearch: Partial<typeof search>) {
    void navigate({
      params: { indexUid, instanceId },
      search: { ...search, ...nextSearch },
      to: "/instances/$instanceId/indexes/$indexUid/documents",
    })
  }

  function handleRefresh() {
    setRefreshNonce((current) => current + 1)
  }

  function openCreateDialog() {
    setEditorTitle("Create document")
    setEditorValue("{}")
    setEditorOpen(true)
  }

  async function openEditDialog(documentId: string) {
    if (!instance) {
      return
    }

    try {
      const document = await getDocument(instance, indexUid, documentId)

      setEditorTitle(`Edit ${documentId}`)
      setEditorValue(JSON.stringify(document, null, 2))
      setEditorOpen(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
    }
  }

  async function handleSaveDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!instance) {
      return
    }

    try {
      const parsed = JSON.parse(editorValue) as unknown

      if (Array.isArray(parsed) || parsed === null) {
        throw new Error("Document payload must be a single JSON object.")
      }

      const task = await upsertDocument(
        instance,
        indexUid,
        parsed as DocumentRecord
      )
      setResultMessage(`Document update enqueued as task ${task.taskUid}.`)
      setEditorOpen(false)
      updateSearch({})
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!instance) {
      return
    }

    try {
      const task = await deleteDocument(instance, indexUid, documentId)
      setResultMessage(`Document delete enqueued as task ${task.taskUid}.`)
      updateSearch({})
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
    }
  }

  return (
    <main className="flex min-h-svh justify-center p-6">
      <div className="flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Button
              onClick={() =>
                void navigate({
                  params: { instanceId },
                  search: {
                    indexGroup: search.indexGroup,
                    indexQuery: search.indexQuery,
                    indexSort: search.indexSort,
                  },
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
              <h1 className="text-2xl font-semibold">{indexUid} documents</h1>
              <p className="text-sm text-muted-foreground">
                Browse one index in either table mode or raw JSON mode.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              onClick={() =>
                void navigate({
                  params: { instanceId },
                  search: {
                    indexGroup: search.indexGroup,
                    indexQuery: search.indexQuery,
                    indexSort: search.indexSort,
                  },
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
              disabled={!instance || isLoading}
              onClick={handleRefresh}
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
              Go back to the root page and add the instance again.
            </AlertDescription>
          </Alert>
        ) : null}

        {instance ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Document controls</CardTitle>
                <CardDescription>
                  Search, page through results, and upsert a single document
                  with raw JSON.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FieldGroup className="grid gap-4 md:grid-cols-12">
                  <Field className="md:col-span-7 lg:col-span-8">
                    <FieldLabel htmlFor="documents-query">Search</FieldLabel>
                    <Input
                      id="documents-query"
                      onChange={(event) => setQueryInput(event.target.value)}
                      placeholder="Search this index"
                      value={queryInput}
                    />
                  </Field>
                  <Field className="md:col-span-2 lg:col-span-2">
                    <FieldLabel htmlFor="documents-limit">Limit</FieldLabel>
                    <Select
                      onValueChange={(value) =>
                        updateSearch({ limit: Number(value), page: 1 })
                      }
                      value={String(search.limit)}
                    >
                      <SelectTrigger className="w-full" id="documents-limit">
                        <SelectValue placeholder="20" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex flex-wrap items-end gap-2 md:col-span-3 md:justify-end lg:col-span-2">
                    <Button
                      onClick={() => updateSearch({ page: 1, query: queryInput })}
                      type="button"
                      variant="outline"
                    >
                      Apply search
                    </Button>
                    <Button
                      onClick={() => {
                        setQueryInput("")
                        updateSearch({ page: 1, query: "" })
                      }}
                      type="button"
                      variant="outline"
                    >
                      Clear
                    </Button>
                    <Button onClick={openCreateDialog} type="button">
                      Create document
                    </Button>
                  </div>
                </FieldGroup>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Page {search.page} of {totalPages}
                  </span>
                  <span>Primary key: {primaryKey ?? "Not configured"}</span>
                  {resultMessage ? <span>{resultMessage}</span> : null}
                </div>
              </CardContent>
            </Card>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to load documents</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <Tabs
              onValueChange={(value) =>
                updateSearch({
                  view: value === "json" ? "json" : "table",
                })
              }
              value={search.view}
            >
              <TabsList>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="json">Raw JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="table">
                <Card>
                  <CardHeader>
                    <CardTitle>Table view</CardTitle>
                    <CardDescription>
                      {isLoading
                        ? "Loading documents..."
                        : `${documents.length} document(s) in the current result window`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((column) => {
                            const isSortedColumn = search.sortBy === column
                            const isAscending = search.sortDir !== "desc"

                            return (
                              <TableHead key={column}>
                                <Button
                                  className="-ml-3 h-8 px-3"
                                  onClick={() =>
                                    updateSearch({
                                      sortBy: column,
                                      sortDir:
                                        isSortedColumn && isAscending
                                          ? "desc"
                                          : "asc",
                                    })
                                  }
                                  type="button"
                                  variant="ghost"
                                >
                                  <span>{column}</span>
                                  {isSortedColumn ? (
                                    isAscending ? (
                                      <ArrowUpIcon className="size-3.5" />
                                    ) : (
                                      <ArrowDownIcon className="size-3.5" />
                                    )
                                  ) : (
                                    <ArrowUpDownIcon className="size-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TableHead>
                            )
                          })}
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedDocuments.map((document, index) => {
                          const documentId = getDocumentIdentifier(
                            document,
                            primaryKey
                          )

                          return (
                            <TableRow key={documentId ?? `${index}`}>
                              {columns.map((column) => (
                                <TableCell className="align-top" key={column}>
                                  <DocumentValueCell value={document[column]} />
                                </TableCell>
                              ))}
                              <TableCell className="w-[1%] whitespace-nowrap">
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    disabled={!documentId}
                                    onClick={() => {
                                      if (documentId) {
                                        void openEditDialog(documentId)
                                      }
                                    }}
                                    type="button"
                                    variant="outline"
                                  >
                                    Edit
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger
                                      disabled={!documentId}
                                      render={<Button variant="destructive" />}
                                    >
                                      Delete
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete document{" "}
                                          {documentId ?? "unknown"}?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This deletes one document by primary
                                          key.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => {
                                            if (documentId) {
                                              void handleDeleteDocument(
                                                documentId
                                              )
                                            }
                                          }}
                                          variant="destructive"
                                        >
                                          Delete document
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={search.page <= 1}
                        onClick={() =>
                          updateSearch({ page: Math.max(1, search.page - 1) })
                        }
                        type="button"
                        variant="outline"
                      >
                        Previous page
                      </Button>
                      <Button
                        disabled={search.page >= totalPages}
                        onClick={() =>
                          updateSearch({
                            page: Math.min(totalPages, search.page + 1),
                          })
                        }
                        type="button"
                        variant="outline"
                      >
                        Next page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="json">
                <Card>
                  <CardHeader>
                    <CardTitle>Raw payload</CardTitle>
                    <CardDescription>
                      One card per returned document, plus request metadata that
                      is actually useful.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocumentRawJsonView
                      documents={documents}
                      metadata={rawMetadata}
                      primaryKey={primaryKey}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Dialog onOpenChange={setEditorOpen} open={editorOpen}>
              <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-5xl">
                <DialogHeader>
                  <DialogTitle>{editorTitle}</DialogTitle>
                  <DialogDescription>
                    Submit one JSON object. Bulk import is intentionally out of
                    scope for this phase.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden"
                  onSubmit={handleSaveDocument}
                >
                  <FieldGroup className="min-h-0 flex-1">
                    <Field className="min-h-0 flex-1">
                      <FieldLabel htmlFor="document-json">
                        Document JSON
                      </FieldLabel>
                      <Textarea
                        className="min-h-[32rem] flex-1 overflow-auto font-mono text-xs leading-6 [tab-size:2]"
                        id="document-json"
                        onChange={(event) => setEditorValue(event.target.value)}
                        value={editorValue}
                      />
                    </Field>
                  </FieldGroup>
                  <DialogFooter className="shrink-0">
                    <Button type="submit">Save document</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </div>
    </main>
  )
}

function getNumericField(
  value: Record<string, unknown> | null,
  key: string
): number | null {
  const candidate = value?.[key]

  return typeof candidate === "number" ? candidate : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
