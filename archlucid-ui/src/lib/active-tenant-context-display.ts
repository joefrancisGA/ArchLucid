import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import { listRegisteredSampleScenarios } from "@/lib/samples/registry";
import {
  SHOWCASE_DEMO_TENANT_CATALOG_ID,
  SHOWCASE_DEMO_TENANT_NAME,
} from "@/lib/showcase-static-demo";

/** Shown on organization surfaces when IdP did not supply a human-readable tenant name. */
export const TENANT_ORGANIZATION_NAME_UNAVAILABLE =
  "Not provided by your identity provider" as const;

function isGuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

function resolveTenantDisplayNameFromCatalogId(tenantId: string): string | null {
  const normalized = tenantId.trim().toLowerCase();

  for (const scenario of listRegisteredSampleScenarios()) {
    if (scenario.tenantCatalogId.trim().toLowerCase() === normalized) {
      return scenario.tenantName;
    }
  }

  return null;
}

/** Buyer-safe tenant label — never returns a raw catalog GUID. */
export function resolveTenantOrganizationDisplayName(tenantId: string, rawDisplayName: string): string {
  const fromCatalog = resolveTenantDisplayNameFromCatalogId(tenantId);

  if (fromCatalog !== null) {
    return fromCatalog;
  }

  const trimmed = rawDisplayName.trim();

  if (trimmed.length > 0 && !isGuidLike(trimmed)) {
    return trimmed;
  }

  return TENANT_ORGANIZATION_NAME_UNAVAILABLE;
}

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

  const resolvedTenantId = tenantId.length > 0 ? tenantId : "unknown";

  return {
    displayName: tenantId.length > 0 ? tenantId : "Unknown tenant",
    tenantId: resolvedTenantId,
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
