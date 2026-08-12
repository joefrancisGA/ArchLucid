import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  getEffectiveBrowserProxyScopeHeaders,
} from "@/lib/operator/operator-scope-storage";

/** TanStack Query key segment for tenant/workspace/project scope (TB-562 / TB-695). */
export type OperatorScopeQueryKey = {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
};

const EMPTY_OPERATOR_SCOPE_QUERY_KEY: OperatorScopeQueryKey = {
  tenantId: "",
  workspaceId: "",
  projectId: "",
};

export function parseOperatorScopeQueryKey(serialized: string): OperatorScopeQueryKey {
  if (serialized.length === 0) {
    return EMPTY_OPERATOR_SCOPE_QUERY_KEY;
  }

  const [tenantId, workspaceId, projectId] = serialized.split(":");

  return {
    tenantId: tenantId ?? "",
    workspaceId: workspaceId ?? "",
    projectId: projectId ?? "",
  };
}

export function getOperatorScopeQueryKeySnapshot(): string {
  const headers = getEffectiveBrowserProxyScopeHeaders();

  return `${headers["x-tenant-id"] ?? ""}:${headers["x-workspace-id"] ?? ""}:${headers["x-project-id"] ?? ""}`;
}

export function getOperatorScopeQueryKeyServerSnapshot(): string {
  return "";
}

export function subscribeOperatorScopeQueryKey(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onStoreChange);
  };
}
