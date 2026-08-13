import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import {
  defaultLabelsForScopeIds,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import { requiredAuthorityFromRank } from "@/lib/nav-authority";
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

export const TENANT_SETTINGS_PAGE_SUBTITLE =
  "Configure this workspace and the tenant-wide defaults its reviews inherit." as const;

/** Vocabulary rail current-surface label — not the deprecated "Tenant settings" peer name. */
export const TENANT_SETTINGS_VOCABULARY_CURRENT_LABEL = "Workspace settings" as const;

export const TENANT_COST_SETTINGS_EA_DISCOUNT_HELPER =
  "Enter 0 for list pricing. Enter 15 to price Azure savings at 85% of retail." as const;

export const TENANT_COST_SETTINGS_SAVE_READINESS_MESSAGE =
  "Fix the highlighted values to save." as const;

export const TENANT_SETTINGS_SCOPE_UNRESOLVED_SUMMARY =
  "Active scope: select a workspace and project from the workspace switcher." as const;

function isNonEmptyScopeId(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

function resolveWorkspaceLabelForSummary(
  workspaceId: string,
  scopeRecord: OperatorScopeRecord | null,
): string {
  const fromRecord = scopeRecord?.workspaceLabel.trim() ?? "";

  if (fromRecord.length > 0) {
    return fromRecord;
  }

  return defaultLabelsForScopeIds(workspaceId, scopeRecord?.projectId ?? "").workspace;
}

/** Buyer-facing authority label for the page header metadata row. */
export function tenantSettingsCallerAuthorityLine(
  callerAuthorityRank: number,
  workspaceLabel: string,
): string {
  const authority = requiredAuthorityFromRank(callerAuthorityRank);
  const authorityLabel =
    authority === "AdminAuthority"
      ? "Admin"
      : authority === "ExecuteAuthority"
        ? "Execute"
        : "Read";
  const workspace = workspaceLabel.trim().length > 0 ? workspaceLabel.trim() : "this workspace";

  return `${authorityLabel} authority in ${workspace}`;
}

/** Above-the-fold scope line — mirrors workspace switcher labels when present. */
export function tenantSettingsActiveScopeSummary(scope: OperatorScopeRecord | null): string {
  if (scope === null) {
    return TENANT_SETTINGS_SCOPE_UNRESOLVED_SUMMARY;
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

/**
 * Resolves the active scope summary from the same effective proxy headers the page uses for routing.
 * Prefer labels from operator scope storage when IDs match; otherwise use buyer-safe ID fallbacks.
 */
export function tenantSettingsEffectiveScopeSummary(
  scopeHeaders: Record<string, string>,
  scopeRecord: OperatorScopeRecord | null,
): string {
  const workspaceId = scopeHeaders["x-workspace-id"]?.trim() ?? "";
  const projectId = scopeHeaders["x-project-id"]?.trim() ?? "";

  if (!isNonEmptyScopeId(workspaceId) || !isNonEmptyScopeId(projectId)) {
    return TENANT_SETTINGS_SCOPE_UNRESOLVED_SUMMARY;
  }

  const recordMatchesHeaders =
    scopeRecord !== null
    && scopeRecord.workspaceId === workspaceId
    && scopeRecord.projectId === projectId;

  const fallbackLabels = defaultLabelsForScopeIds(workspaceId, projectId);
  const workspaceLabel =
    recordMatchesHeaders && scopeRecord.workspaceLabel.trim().length > 0
      ? scopeRecord.workspaceLabel.trim()
      : fallbackLabels.workspace;
  const projectLabel =
    recordMatchesHeaders && scopeRecord.projectLabel.trim().length > 0
      ? scopeRecord.projectLabel.trim()
      : fallbackLabels.project;

  return `Active scope: ${formatScopeSwitcherTriggerLabel({
    workspaceLabel,
    projectLabel,
    isSampleWorkspaceSession: false,
    includeProject: true,
  })}`;
}

export { resolveWorkspaceLabelForSummary };

/** @deprecated Prefer {@link tenantSettingsCallerAuthorityLine}. */
export function tenantSettingsSignedInAsLine(principalName: string | null): string | null {
  const trimmed = principalName?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return `Signed in as ${trimmed}`;
}
