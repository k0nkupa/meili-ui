"use client"

import { useEffect, useState } from "react"
import { PencilIcon, PlusIcon, ServerIcon, Trash2Icon } from "lucide-react"

import type { SavedInstance } from "@/lib/meili/types"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getInstanceHostError } from "@/lib/meili/storage"

export type SavedInstanceDraft = {
  id?: string
  name: string
  host: string
  apiKey: string
}

type SavedInstancesPanelProps = {
  instances: Array<SavedInstance>
  lastSelectedInstanceId: string | null
  onRemove: (instanceId: string) => void
  onSave: (draft: SavedInstanceDraft) => void
  onSelect: (instanceId: string) => void
}

const EMPTY_DRAFT: SavedInstanceDraft = {
  name: "",
  host: "",
  apiKey: "",
}

export function SavedInstancesPanel({
  instances,
  lastSelectedInstanceId,
  onRemove,
  onSave,
  onSelect,
}: SavedInstancesPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<SavedInstanceDraft>(EMPTY_DRAFT)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!dialogOpen) {
      setDraft(EMPTY_DRAFT)
      setSubmitError(null)
    }
  }, [dialogOpen])

  const hasInstances = instances.length > 0
  const dialogTitle = draft.id ? `Edit ${draft.name}` : "Add instance"

  function updateDraft(
    field: keyof Omit<SavedInstanceDraft, "id">,
    value: string
  ) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const hostError = getInstanceHostError(draft.host)

    if (hostError) {
      setSubmitError(hostError)
      return
    }

    onSave({
      ...draft,
      apiKey: draft.apiKey.trim(),
      host: draft.host.trim(),
      name: draft.name.trim(),
    })
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Meilisearch instances</h1>
          <p className="text-sm text-muted-foreground">
            Save internal instances locally, then open one to inspect indexes,
            documents, tasks, and settings.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} type="button">
          <PlusIcon data-icon="inline-start" />
          Add instance
        </Button>
      </div>

      {!hasInstances ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ServerIcon />
            </EmptyMedia>
            <EmptyTitle>No saved instances yet</EmptyTitle>
            <EmptyDescription>
              Add a host and API key to start browsing Meilisearch from this
              browser.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {instances.map((instance) => {
            const isLastUsed = instance.id === lastSelectedInstanceId

            return (
              <Card key={instance.id}>
                <CardHeader className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <CardTitle>{instance.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {instance.host}
                      </p>
                    </div>
                    {isLastUsed ? (
                      <Badge variant="secondary">Last used</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Alert>
                    <AlertTitle>Stored locally</AlertTitle>
                    <AlertDescription>
                      This browser keeps the host and API key in localStorage.
                      Use scoped keys only; do not use this flow for public
                      deployments.
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => onSelect(instance.id)} type="button">
                      Open {instance.name}
                    </Button>
                    <Button
                      onClick={() => {
                        setDraft({
                          apiKey: instance.apiKey,
                          host: instance.host,
                          id: instance.id,
                          name: instance.name,
                        })
                        setDialogOpen(true)
                      }}
                      type="button"
                      variant="outline"
                    >
                      <PencilIcon data-icon="inline-start" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="destructive" />}
                      >
                        <Trash2Icon data-icon="inline-start" />
                        Remove
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove {instance.name}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This deletes the saved instance from localStorage
                            for this browser only.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onRemove(instance.id)}
                            variant="destructive"
                          >
                            Remove instance
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              Enter a friendly name, the Meilisearch host URL, and the API key.
            </DialogDescription>
          </DialogHeader>
          {submitError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to save instance</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="instance-name">Name</FieldLabel>
                <Input
                  id="instance-name"
                  onChange={(event) => updateDraft("name", event.target.value)}
                  required
                  value={draft.name}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="instance-host">Host</FieldLabel>
                <Input
                  id="instance-host"
                  inputMode="url"
                  onChange={(event) => updateDraft("host", event.target.value)}
                  placeholder="https://search.example.com"
                  required
                  type="url"
                  value={draft.host}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="instance-api-key">API key</FieldLabel>
                <Input
                  id="instance-api-key"
                  onChange={(event) =>
                    updateDraft("apiKey", event.target.value)
                  }
                  required
                  type="password"
                  value={draft.apiKey}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit">Save instance</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
