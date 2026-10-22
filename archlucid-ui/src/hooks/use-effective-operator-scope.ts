"use client";

import { useMemo } from "react";

import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";
import {
  isSampleWorkspaceScope,
  operatorScopeRecordFromProxyHeaders,
} from "@/lib/operator/operator-workspace-scope-model";

/** Active tenant/workspace/project for API scope headers, including JWT-backed dedicated scope. */
export function useEffectiveOperatorScopeRecord(): OperatorScopeRecord {
  const stored = useOperatorScopeRecord();

  return useMemo(() => {
    const headers = getEffectiveBrowserProxyScopeHeaders();

    return operatorScopeRecordFromProxyHeaders(headers, {
      workspaceLabel: stored?.workspaceLabel ?? "",
      projectLabel: stored?.projectLabel ?? "",
    });
  }, [stored]);
}

/** True when the effective operator scope is the dev-default or demo-seeded sample workspace. */
export function useIsSampleWorkspaceSession(): boolean {
  const record = useEffectiveOperatorScopeRecord();

  return useMemo(
    () => isSampleWorkspaceScope(record),
    [record.projectId, record.tenantId, record.workspaceId],
  );
}
