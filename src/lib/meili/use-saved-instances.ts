"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { SavedInstance, SavedInstancesState } from "@/lib/meili/types"
import {
  createSavedInstance,
  loadSavedInstancesState,
  removeSavedInstance,
  saveSavedInstancesState,
  upsertSavedInstance,
} from "@/lib/meili/storage"

const EMPTY_STATE: SavedInstancesState = {
  instances: [],
  lastSelectedInstanceId: null,
}

type SavedInstanceDraft = {
  id?: string
  name: string
  host: string
  apiKey: string
}

export function useSavedInstances() {
  const [state, setState] = useState<SavedInstancesState>(EMPTY_STATE)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setState(loadSavedInstancesState())
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    saveSavedInstancesState(state)
  }, [isHydrated, state])

  const selectedInstance = useMemo(
    () =>
      state.instances.find(({ id }) => id === state.lastSelectedInstanceId) ??
      null,
    [state.instances, state.lastSelectedInstanceId]
  )

  const saveInstance = useCallback((draft: SavedInstanceDraft) => {
    setState((currentState) => {
      const existing = draft.id
        ? (currentState.instances.find(({ id }) => id === draft.id) ?? null)
        : null

      const nextInstance: SavedInstance = existing
        ? {
            ...existing,
            apiKey: draft.apiKey,
            host: draft.host,
            name: draft.name,
          }
        : createSavedInstance(draft)

      return upsertSavedInstance(currentState, nextInstance)
    })
  }, [])

  const selectInstance = useCallback((instanceId: string) => {
    setState((currentState) =>
      currentState.lastSelectedInstanceId === instanceId
        ? currentState
        : {
            ...currentState,
            lastSelectedInstanceId: instanceId,
          }
    )
  }, [])

  const deleteInstance = useCallback((instanceId: string) => {
    setState((currentState) => removeSavedInstance(currentState, instanceId))
  }, [])

  const getInstance = useCallback(
    (instanceId: string) =>
      state.instances.find(({ id }) => id === instanceId) ?? null,
    [state.instances]
  )

  return {
    deleteInstance,
    getInstance,
    isHydrated,
    saveInstance,
    selectInstance,
    selectedInstance,
    state,
  }
}
