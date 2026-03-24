import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { Card, CardContent } from "@/components/ui/card"
import { SavedInstancesPanel } from "@/features/meili/saved-instances-panel"
import { useSavedInstances } from "@/lib/meili/use-saved-instances"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  const navigate = useNavigate()
  const { deleteInstance, isHydrated, saveInstance, selectInstance, state } =
    useSavedInstances()

  return (
    <main className="flex min-h-svh justify-center p-6">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        {isHydrated ? (
          <SavedInstancesPanel
            instances={state.instances}
            lastSelectedInstanceId={state.lastSelectedInstanceId}
            onRemove={deleteInstance}
            onSave={saveInstance}
            onSelect={(instanceId) => {
              selectInstance(instanceId)
              void navigate({
                params: { instanceId },
                to: "/instances/$instanceId",
              })
            }}
          />
        ) : (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Loading saved instances...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
