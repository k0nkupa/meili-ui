"use client"

import type { DocumentRecord } from "@/lib/meili/api"
import {
  formatDocumentCellValue,
  getDocumentIdentifier,
} from "@/lib/meili/documents"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export type DocumentMetadataItem = {
  label: string
  value: string
}

type DocumentRawJsonViewProps = {
  documents: Array<DocumentRecord>
  metadata: Array<DocumentMetadataItem>
  primaryKey: string | null
}

type DocumentValueCellProps = {
  value: unknown
}

function DocumentValueCell({ value }: DocumentValueCellProps) {
  const text = formatDocumentCellValue(value)

  return (
    <div
      className="max-w-[18rem] truncate text-sm whitespace-nowrap"
      title={text || undefined}
    >
      {text || "\u2014"}
    </div>
  )
}

function DocumentRawJsonView({
  documents,
  metadata,
  primaryKey,
}: DocumentRawJsonViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metadata.map((item) => (
          <div
            className="rounded-lg border bg-muted/20 px-4 py-3"
            key={item.label}
          >
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {item.label}
            </p>
            <p className="mt-1 truncate text-sm font-medium" title={item.value}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {documents.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {documents.map((document, index) => {
            const documentId = getDocumentIdentifier(document, primaryKey)
            const title = documentId
              ? `Document ${documentId}`
              : `Document ${index + 1}`

            return (
              <Card key={documentId ?? `document-${index}`}>
                <CardHeader>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>
                    Pretty-printed JSON for this document only.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[24rem] rounded-md border">
                    <pre className="p-4 font-mono text-xs leading-6 whitespace-pre-wrap">
                      {JSON.stringify(document, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No documents in the current result window.
        </div>
      )}
    </div>
  )
}

export { DocumentRawJsonView, DocumentValueCell }
