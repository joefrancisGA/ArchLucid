"use client";

import { useEffect, useState } from "react";

import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { rehydrateInFlightOperationsFromArchitecture } from "@/lib/operations/rehydrate-in-flight-from-architecture";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";

function useOperatorScopeGeneration(): number {
  const [scopeGeneration, setScopeGeneration] = useState(0);

  useEffect(() => {
    function handleScopeChanged(): void {
      setScopeGeneration((value) => value + 1);
    }

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, handleScopeChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, handleScopeChanged);
    };
  }, []);

  return scopeGeneration;
}

function runRehydrateForArchitectureId(architectureId: string | null | undefined): void {
  const trimmedArchitectureId = architectureId?.trim() ?? "";

  if (trimmedArchitectureId.length === 0) {
    return;
  }

  const scopeRecord = readOperatorScopeFromStorage();

  void rehydrateInFlightOperationsFromArchitecture({
    tenantId: scopeRecord?.tenantId,
    workspaceId: scopeRecord?.workspaceId,
    projectId: scopeRecord?.projectId,
    architectureId: trimmedArchitectureId,
  });
}

export function useRehydrateInFlightOperationsFromArchitecture(architectureId: string | null | undefined): void {
  const scopeGeneration = useOperatorScopeGeneration();

  useEffect(() => {
    runRehydrateForArchitectureId(architectureId);
  }, [architectureId, scopeGeneration]);
}

/** Working shell: rebuild in-flight rows for the last-open architecture desk (DA-10 / CA-46). */
export function useRehydrateInFlightFromWorkingContinuity(): void {
  const scopeGeneration = useOperatorScopeGeneration();

  useEffect(() => {
    runRehydrateForArchitectureId(readCachedLastOpenArchitectureId());
  }, [scopeGeneration]);
}
