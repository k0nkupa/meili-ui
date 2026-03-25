"use client"

import { useEffect, useState } from "react"

import type { CreateIndexInput } from "@/lib/meili/indexes"
import {
  getCreateIndexUidError,
  normalizeCreateIndexInput,
} from "@/lib/meili/indexes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type CreateIndexDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateIndexInput) => Promise<void>
}

const EMPTY_DRAFT: CreateIndexInput = {
  primaryKey: "",
  uid: "",
}

export function CreateIndexDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateIndexDialogProps) {
  const [draft, setDraft] = useState<CreateIndexInput>(EMPTY_DRAFT)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uidError, setUidError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setDraft(EMPTY_DRAFT)
      setErrorMessage(null)
      setUidError(null)
      setIsSubmitting(false)
    }
  }, [open])

  function updateDraft(field: keyof CreateIndexInput, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))

    if (field === "uid" && uidError) {
      setUidError(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextUidError = getCreateIndexUidError(draft.uid)

    setErrorMessage(null)
    setUidError(nextUidError)

    if (nextUidError) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(normalizeCreateIndexInput(draft))
      onOpenChange(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create index</DialogTitle>
          <DialogDescription>
            Create one empty index explicitly instead of waiting for documents
            to do it implicitly. Wild concept, I know.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="create-index-uid">Index UID</FieldLabel>
              <Input
                id="create-index-uid"
                onChange={(event) => updateDraft("uid", event.target.value)}
                placeholder="movies"
                value={draft.uid}
              />
              <FieldDescription>
                Required. Use only letters, numbers, hyphens, and underscores.
              </FieldDescription>
              <FieldError>{uidError}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="create-index-primary-key">
                Primary key
              </FieldLabel>
              <Input
                id="create-index-primary-key"
                onChange={(event) =>
                  updateDraft("primaryKey", event.target.value)
                }
                placeholder="id"
                value={draft.primaryKey ?? ""}
              />
              <FieldDescription>
                Optional. Leave blank to configure it later or let Meilisearch
                infer it from documents.
              </FieldDescription>
            </Field>
          </FieldGroup>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to create index</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              Create index
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
