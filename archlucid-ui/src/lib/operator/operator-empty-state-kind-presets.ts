import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import type { OperatorEmptyStateKind } from "@/lib/operator/operator-empty-state-migration-inventory";

/**
 * TB-1555 — Title/copy conventions per operator empty kind (**TB-1552**).
 * Prefer these helpers over inventing "No X yet" vs filter-no-match strings at call sites.
 */

export type OperatorEmptyStateKindPresetInput = {
  readonly testId: string;
  readonly description: string;
  readonly actions?: EnterpriseCompactEmptyStateProps["actions"];
};

/** Collection / hub-zone: `No {noun phrase} yet`. */
export function operatorCollectionEmptyTitle(nounPhrase: string): string {
  return `No ${nounPhrase} yet`;
}

/** Hub-zone sections use the same title pattern as collection empties. */
export function operatorHubZoneEmptyTitle(zoneNounPhrase: string): string {
  return operatorCollectionEmptyTitle(zoneNounPhrase);
}

/** Filtered inventory when backing rows exist but the active filter hides all of them. */
export function operatorFilteredEmptyTitle(nounPhrase?: string): string {
  if (nounPhrase !== undefined && nounPhrase.length > 0) {
    return `No ${nounPhrase} match this filter`;
  }

  return "No matches for this filter";
}

/** Prerequisite — operator must complete setup before the page job can run. */
export function operatorPrerequisiteEmptyTitle(prerequisiteLabel: string): string {
  return `${prerequisiteLabel} required`;
}

/** Permission / read-only rank — no fake primary Create. */
export function operatorPermissionEmptyTitle(accessNounPhrase: string): string {
  return `You need access to ${accessNounPhrase}`;
}

export function buildOperatorCollectionEmptyCompact(
  nounPhrase: string,
  input: OperatorEmptyStateKindPresetInput,
): EnterpriseCompactEmptyStateProps {
  return {
    testId: input.testId,
    title: operatorCollectionEmptyTitle(nounPhrase),
    description: input.description,
    actions: input.actions,
  };
}

export function buildOperatorHubZoneEmptyCompact(
  zoneNounPhrase: string,
  input: OperatorEmptyStateKindPresetInput,
): EnterpriseCompactEmptyStateProps {
  return {
    testId: input.testId,
    title: operatorHubZoneEmptyTitle(zoneNounPhrase),
    description: input.description,
    actions: input.actions,
  };
}

export function buildOperatorFilteredEmptyCompact(
  input: OperatorEmptyStateKindPresetInput & { readonly nounPhrase?: string },
): EnterpriseCompactEmptyStateProps {
  return {
    testId: input.testId,
    title: operatorFilteredEmptyTitle(input.nounPhrase),
    description: input.description,
    actions: input.actions,
  };
}

export function buildOperatorPrerequisiteEmptyCompact(
  prerequisiteLabel: string,
  input: OperatorEmptyStateKindPresetInput,
): EnterpriseCompactEmptyStateProps {
  return {
    testId: input.testId,
    title: operatorPrerequisiteEmptyTitle(prerequisiteLabel),
    description: input.description,
    actions: input.actions,
  };
}

export function buildOperatorPermissionEmptyCompact(
  accessNounPhrase: string,
  input: OperatorEmptyStateKindPresetInput,
): EnterpriseCompactEmptyStateProps {
  return {
    testId: input.testId,
    title: operatorPermissionEmptyTitle(accessNounPhrase),
    description: input.description,
    actions: input.actions,
  };
}

/** Maps exported `*_COMPACT` preset keys to their operator empty kind for **TB-1556** extension. */
export const OPERATOR_EMPTY_STATE_PRESET_KINDS: Readonly<Record<string, OperatorEmptyStateKind>> = {
  RUNS_EMPTY_COMPACT: "collection",
  OPERATOR_HOME_REVIEWS_EMPTY_COMPACT: "collection",
  OPERATOR_HOME_ARCHIVED_EMPTY_COMPACT: "filtered",
  SEARCH_EMPTY_COMPACT: "filtered",
  PLANNING_EMPTY_COMPACT: "collection",
  COMPARE_WAITING_COMPACT: "prerequisite",
  COMPARE_ZERO_FINALIZED_COMPACT: "prerequisite",
  COMPARE_FINDING_CORRELATION_EMPTY_COMPACT: "hub-zone",
  COMPARE_INSUFFICIENT_FINALIZED_COMPACT: "prerequisite",
  COMPARE_WAITING_BUYER_COMPACT: "prerequisite",
  REVIEW_SCORECARD_EMPTY_COMPACT: "collection",
  PRODUCT_LEARNING_EMPTY_COMPACT: "collection",
  WEBHOOKS_SUBSCRIPTIONS_EMPTY_COMPACT: "collection",
  INTEGRATION_EVENTS_DLQ_EMPTY_COMPACT: "collection",
  INTEGRATION_EVENTS_DLQ_FILTER_EMPTY_COMPACT: "filtered",
  SCIM_NO_TOKENS_EMPTY_COMPACT: "collection",
  IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT: "prerequisite",
  DECISION_REGISTER_EMPTY_COMPACT: "collection",
  SPONSOR_REVIEWS_EMPTY_COMPACT: "collection",
  STANDARDS_RULES_EMPTY_COMPACT: "collection",
  GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT: "filtered",
  GOVERNANCE_FINDINGS_LOAD_FAILED_COMPACT: "error",
  GOVERNANCE_APPROVAL_LINEAGE_FINDINGS_EMPTY_COMPACT: "hub-zone",
  GOVERNANCE_APPROVAL_LINEAGE_NO_DATA_COMPACT: "error",
  GOVERNANCE_WORKFLOW_NO_APPROVALS_EMPTY_COMPACT: "collection",
  GOVERNANCE_WORKFLOW_NO_PROMOTIONS_EMPTY_COMPACT: "collection",
  GOVERNANCE_WORKFLOW_NO_ACTIVATIONS_EMPTY_COMPACT: "collection",
  SETTINGS_ROLES_MATRIX_LOAD_FAILED_COMPACT: "error",
  SETTINGS_ROLES_PENDING_INVITATIONS_LOAD_FAILED_COMPACT: "error",
  RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT: "prerequisite",
  RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT: "hub-zone",
  MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT: "hub-zone",
  ALERT_RULES_LIST_EMPTY_COMPACT: "hub-zone",
  COMPOSITE_RULES_LIST_EMPTY_COMPACT: "hub-zone",
  ADVISORY_SCHEDULES_EMPTY_COMPACT: "hub-zone",
  ADVISORY_SCHEDULES_NO_FINALIZED_REVIEWS_EMPTY_COMPACT: "prerequisite",
  ALERTS_INBOX_FILTERED_EMPTY_COMPACT: "filtered",
  ALERTS_INBOX_NO_RULES_EMPTY_COMPACT: "prerequisite",
  ALERTS_INBOX_NO_REVIEWS_EMPTY_COMPACT: "prerequisite",
  ALERTS_INBOX_HEALTHY_EMPTY_COMPACT: "collection",
  ACCOUNT_SECURITY_DEMO_BLOCKED_EMPTY_COMPACT: "prerequisite",
  ACCOUNT_SECURITY_AUTH_REQUIRED_EMPTY_COMPACT: "prerequisite",
  API_KEYS_SURFACE_DISABLED_EMPTY_COMPACT: "prerequisite",
  API_KEYS_FORBIDDEN_EMPTY_COMPACT: "permission",
};
