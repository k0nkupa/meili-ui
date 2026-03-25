"use client"

import { useEffect, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ChevronLeftIcon } from "lucide-react"
import type { Settings } from "meilisearch"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { getIndexSettings, updateIndexSettings } from "@/lib/meili/api"
import { DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH } from "@/lib/meili/index-overview"
import { useSavedInstances } from "@/lib/meili/use-saved-instances"

export const Route = createFileRoute(
  "/instances/$instanceId/indexes/$indexUid/settings"
)({
  component: SettingsPage,
})

function SettingsPage() {
  const navigate = useNavigate()
  const { indexUid, instanceId } = Route.useParams()
  const { getInstance, isHydrated, selectInstance } = useSavedInstances()
  const instance = getInstance(instanceId)
  const [settingsValue, setSettingsValue] = useState("{}")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!instance) {
      return
    }

    selectInstance(instance.id)
  }, [instance, selectInstance])

  async function refreshSettings() {
    if (!instance) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const settings = await getIndexSettings(instance, indexUid)
      setSettingsValue(JSON.stringify(settings, null, 2))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshSettings()
  }, [indexUid, instance])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!instance) {
      return
    }

    try {
      const parsed = JSON.parse(settingsValue) as Settings
      const task = await updateIndexSettings(instance, indexUid, parsed)
      setResultMessage(`Settings update enqueued as task ${task.taskUid}.`)
      await refreshSettings()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
    }
  }

  return (
    <main className="flex min-h-svh justify-center p-6">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Button
            onClick={() =>
              void navigate({
                params: { indexUid, instanceId },
                search: {
                  ...DEFAULT_INDEX_OVERVIEW_ROUTE_SEARCH,
                  limit: 20,
                  page: 1,
                  query: "",
                  view: "table",
                },
                to: "/instances/$instanceId/indexes/$indexUid/documents",
              })
            }
            type="button"
            variant="secondary"
          >
            <ChevronLeftIcon data-icon="inline-start" />
            Back to documents
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">{indexUid} settings</h1>
            <p className="text-sm text-muted-foreground">
              Edit raw JSON for this index only. There is no instance-wide
              settings editor in this phase.
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
          <Card>
            <CardHeader>
              <CardTitle>Settings JSON</CardTitle>
              <CardDescription>
                Load, edit, and patch the raw settings payload for this index.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="settings-json">
                      Settings JSON
                    </FieldLabel>
                    <Textarea
                      className="min-h-[34rem] font-mono text-xs"
                      id="settings-json"
                      onChange={(event) => setSettingsValue(event.target.value)}
                      value={settingsValue}
                    />
                  </Field>
                </FieldGroup>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={isLoading} type="submit">
                    Save settings
                  </Button>
                  <Button
                    disabled={isLoading}
                    onClick={() => void refreshSettings()}
                    type="button"
                    variant="outline"
                  >
                    Refresh
                  </Button>
                  {resultMessage ? (
                    <p className="self-center text-sm text-muted-foreground">
                      {resultMessage}
                    </p>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to update settings</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </main>
  )
}
