import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import {
  defaultLabelsForScopeIds,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import { formatScopeSwitcherTriggerLabel } from "@/lib/scope-switcher-display";

export const TENANT_COST_SETTINGS_AUDIT_EVENT_TYPE = "TenantCostSettingsUpdated" as const;

export const TENANT_COST_SETTINGS_AUDIT_HREF = `${GOVERNANCE_AUDIT_PATH}?eventType=${encodeURIComponent(
  TENANT_COST_SETTINGS_AUDIT_EVENT_TYPE,
)}` as const;

export const TENANT_COST_SETTINGS_DEFAULTS_STATUS_LABEL = "Platform defaults" as const;

export const TENANT_COST_SETTINGS_LAST_CHANGED_PREFIX = "Last changed" as const;

export const TENANT_COST_SETTINGS_AUDIT_TRAIL_LINK_LABEL = "View in audit trail" as const;

export const TENANT_SETTINGS_ORGANIZATION_IDP_NOTE =
  "Organization name is managed by your identity provider." as const;

/** Above-the-fold scope line — mirrors workspace switcher labels when present. */
export function tenantSettingsActiveScopeSummary(scope: OperatorScopeRecord | null): string {
  if (scope === null) {
    return "Active scope: select a workspace and project from the workspace switcher.";
  }

  const fallbackLabels = defaultLabelsForScopeIds(scope.workspaceId, scope.projectId);
  const workspaceLabel =
    scope.workspaceLabel.trim().length > 0 ? scope.workspaceLabel.trim() : fallbackLabels.workspace;
  const projectLabel =
    scope.projectLabel.trim().length > 0 ? scope.projectLabel.trim() : fallbackLabels.project;

  return `Active scope: ${formatScopeSwitcherTriggerLabel({
    workspaceLabel,
    projectLabel,
    isSampleWorkspaceSession: false,
    includeProject: true,
  })}`;
}

export function tenantSettingsSignedInAsLine(principalName: string | null): string | null {
  const trimmed = principalName?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return `Signed in as ${trimmed}`;
}
