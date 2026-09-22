import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";

export type OperatorScopeWriteStamp = {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
};

export const OPERATOR_SCOPE_WRITE_MISMATCH_MESSAGE =
  "Workspace scope changed in another tab. Refresh this page before saving.";

export function captureOperatorScopeWriteStamp(): OperatorScopeWriteStamp {
  const headers = getEffectiveBrowserProxyScopeHeaders();

  return {
    tenantId: headers["x-tenant-id"]?.trim() ?? "",
    workspaceId: headers["x-workspace-id"]?.trim() ?? "",
    projectId: headers["x-project-id"]?.trim() ?? "",
  };
}

export function operatorScopeWriteStampMatchesCurrent(stamp: OperatorScopeWriteStamp): boolean {
  const current = captureOperatorScopeWriteStamp();

  return (
    stamp.tenantId === current.tenantId &&
    stamp.workspaceId === current.workspaceId &&
    stamp.projectId === current.projectId
  );
}

export function readOperatorScopeWriteMismatchMessage(stamp: OperatorScopeWriteStamp): string | null {
  if (operatorScopeWriteStampMatchesCurrent(stamp)) {
    return null;
  }

  return OPERATOR_SCOPE_WRITE_MISMATCH_MESSAGE;
}
