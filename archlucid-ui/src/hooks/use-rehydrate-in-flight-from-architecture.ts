"use client";

import { useEffect, useRef } from "react";

import { rehydrateInFlightOperationsFromArchitecture } from "@/lib/operations/rehydrate-in-flight-from-architecture";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

export function useRehydrateInFlightOperationsFromArchitecture(architectureId: string | null | undefined): void {
  const lastScopeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const trimmedArchitectureId = architectureId?.trim() ?? "";

    if (trimmedArchitectureId.length === 0) {
      return;
    }

    const scopeRecord = readOperatorScopeFromStorage();
    const scopeKey = [
      scopeRecord?.tenantId ?? "",
      scopeRecord?.workspaceId ?? "",
      scopeRecord?.projectId ?? "",
      trimmedArchitectureId,
    ].join("|");

    if (lastScopeKeyRef.current === scopeKey) {
      return;
    }

    lastScopeKeyRef.current = scopeKey;

    void rehydrateInFlightOperationsFromArchitecture({
      tenantId: scopeRecord?.tenantId,
      workspaceId: scopeRecord?.workspaceId,
      projectId: scopeRecord?.projectId,
      architectureId: trimmedArchitectureId,
    });
  }, [architectureId]);
}
