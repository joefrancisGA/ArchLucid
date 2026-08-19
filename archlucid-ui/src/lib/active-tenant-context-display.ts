import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import {
  SHOWCASE_DEMO_TENANT_CATALOG_ID,
  SHOWCASE_DEMO_TENANT_NAME,
} from "@/lib/showcase-static-demo";

export type ActiveTenantContextView = {
  displayName: string;
  tenantId: string;
  workspaceId: string | null;
  workspaceLabel: string | null;
};

export function resolveActiveTenantContext(
  scope: OperatorScopeRecord | null,
  buyerPolished: boolean = isBuyerPolishedOperatorShellEnv(),
): ActiveTenantContextView {
  if (buyerPolished) {
    return {
      displayName: SHOWCASE_DEMO_TENANT_NAME,
      tenantId: SHOWCASE_DEMO_TENANT_CATALOG_ID,
      workspaceId: scope?.workspaceId ?? null,
      workspaceLabel: scope?.workspaceLabel ?? null,
    };
  }

  const headers = getEffectiveBrowserProxyScopeHeaders();
  const tenantId = (scope?.tenantId ?? headers["x-tenant-id"] ?? "").trim();
  const workspaceId = (scope?.workspaceId ?? headers["x-workspace-id"] ?? "").trim();
  const workspaceLabel = scope?.workspaceLabel?.trim() ?? "";

  return {
    displayName: tenantId.length > 0 ? tenantId : "Unknown tenant",
    tenantId: tenantId.length > 0 ? tenantId : "unknown",
    workspaceId: workspaceId.length > 0 ? workspaceId : null,
    workspaceLabel: workspaceLabel.length > 0 ? workspaceLabel : null,
  };
}

export function readActiveTenantContext(
  buyerPolished: boolean = isBuyerPolishedOperatorShellEnv(),
): ActiveTenantContextView {
  return resolveActiveTenantContext(readOperatorScopeFromStorage(), buyerPolished);
}

export function formatActiveTenantContextTooltip(context: ActiveTenantContextView): string {
  const workspacePart =
    context.workspaceLabel !== null
      ? ` · Workspace: ${context.workspaceLabel}`
      : context.workspaceId !== null
        ? ` · Workspace ID: ${context.workspaceId}`
        : "";

  return `Active tenant: ${context.displayName} (ID: ${context.tenantId})${workspacePart}. Database-per-tenant isolation applies to this session.`;
}
