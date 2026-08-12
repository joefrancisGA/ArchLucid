/**
 * TB-1554 — Operator EmptyState → Compact migration inventory (dense hubs).
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § Operator empty states (**TB-1552**).
 * Presets: `enterprise-compact-empty-state-presets.ts` (**TB-1555** follow-on).
 * Vitest guard extension: **TB-1556**.
 */

export const OPERATOR_EMPTY_STATE_KINDS = [
  "collection",
  "hub-zone",
  "filtered",
  "prerequisite",
  "permission",
] as const;

export type OperatorEmptyStateKind = (typeof OPERATOR_EMPTY_STATE_KINDS)[number];

export type OperatorEmptyStateChrome = "compact" | "centered-empty-state" | "operator-empty-state" | "hand-rolled";

export type OperatorEmptyStateMigrationDisposition =
  | "compact-native"
  | "migrated"
  | "centered-justified"
  | "coordinate";

export type OperatorEmptyStateMigrationEntry = {
  readonly id: string;
  readonly pathOrSurface: string;
  readonly kind: OperatorEmptyStateKind;
  readonly chrome: OperatorEmptyStateChrome;
  readonly disposition: OperatorEmptyStateMigrationDisposition;
  readonly testId: string | null;
  readonly componentOrModule: string;
  readonly notes: string;
};

/**
 * Dense operator hubs — checked in for agents and **TB-1556** allowlist extension.
 */
export const OPERATOR_EMPTY_STATE_MIGRATION_INVENTORY: readonly OperatorEmptyStateMigrationEntry[] = [
  {
    id: "digests-browse-empty",
    pathOrSurface: "/architecture/digests?tab=get-started",
    kind: "collection",
    chrome: "compact",
    disposition: "compact-native",
    testId: "digests-browse-empty",
    componentOrModule: "components/digests/DigestsBrowseContent.tsx",
    notes: "Compact under master-detail; checklist collapsed (**TB-1480**).",
  },
  {
    id: "recurrence-schedules-empty",
    pathOrSurface: "/governance/recurrence",
    kind: "collection",
    chrome: "compact",
    disposition: "compact-native",
    testId: "recurrence-schedules-empty",
    componentOrModule: "components/governance/RecurrenceSchedulesClient.tsx",
    notes: "Compact + footer Create primary (**TB-1540**).",
  },
  {
    id: "reviews-hub-empty",
    pathOrSurface: "/architecture/reviews",
    kind: "collection",
    chrome: "compact",
    disposition: "compact-native",
    testId: "reviews-hub-empty-inventory",
    componentOrModule: "app/(operator)/architecture/reviews/_sections/ReviewsHubReviewInventory.tsx",
    notes: "Compact inventory empty; Start in header (**TB-1553** / **TB-1541**).",
  },
  {
    id: "advisory-schedules-empty",
    pathOrSurface: "/governance/advisory-scans?tab=schedules",
    kind: "hub-zone",
    chrome: "compact",
    disposition: "compact-native",
    testId: "advisory-schedules-empty",
    componentOrModule: "components/advisory/AdvisorySchedulesContent.tsx",
    notes: "Empty-first + header Create (**TB-1542**).",
  },
  {
    id: "advisory-scans-empty",
    pathOrSurface: "/governance/advisory-scans?tab=scans",
    kind: "hub-zone",
    chrome: "compact",
    disposition: "compact-native",
    testId: "advisory-scans-empty-intro",
    componentOrModule: "components/advisory/AdvisoryScansContent.tsx",
    notes: "Empty intro Compact + Choose review (**TB-1567**).",
  },
  {
    id: "alert-rules-rules-empty",
    pathOrSurface: "/governance/alert-rules?tab=rules",
    kind: "hub-zone",
    chrome: "compact",
    disposition: "compact-native",
    testId: "alert-rules-empty",
    componentOrModule: "components/alerts/AlertRulesContent.tsx",
    notes: "Empty-first Compact + header Create (**TB-1479**).",
  },
  {
    id: "alert-routing-empty",
    pathOrSurface: "/governance/alert-rules?tab=routing",
    kind: "hub-zone",
    chrome: "compact",
    disposition: "compact-native",
    testId: "alert-routing-empty",
    componentOrModule: "components/alerts/AlertRoutingContent.tsx",
    notes: "Compact + header Create reveals panel (**TB-1481**).",
  },
  {
    id: "alerts-inbox-empty",
    pathOrSurface: "/governance/alerts",
    kind: "collection",
    chrome: "compact",
    disposition: "compact-native",
    testId: "alerts-inbox-empty",
    componentOrModule: "components/alerts/AlertsInboxListStates.tsx",
    notes: "Workspace-context Compact variants via presets.",
  },
  {
    id: "governance-findings-empty",
    pathOrSurface: "/governance/findings",
    kind: "collection",
    chrome: "compact",
    disposition: "compact-native",
    testId: "governance-findings-empty-state",
    componentOrModule: "app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx",
    notes: "Collection + filtered Compact presets.",
  },
  {
    id: "governance-overview-no-pending",
    pathOrSurface: "/governance/approval-queue (overview panel)",
    kind: "hub-zone",
    chrome: "compact",
    disposition: "migrated",
    testId: "governance-overview-no-pending",
    componentOrModule: "app/(operator)/governance/_sections/GovernanceOverviewPanel.tsx",
    notes: "Migrated from centered EmptyState + icon (**TB-1554**).",
  },
  {
    id: "standards-rules-empty",
    pathOrSurface: "/governance/standards-and-rules",
    kind: "collection",
    chrome: "compact",
    disposition: "migrated",
    testId: "standards-rules-empty-state",
    componentOrModule: "app/(operator)/governance/standards-and-rules/_sections/StandardsRulesEmptyState.tsx",
    notes: "Migrated from hand-rolled neutral card (**TB-1554**).",
  },
  {
    id: "governance-workflow-no-approvals",
    pathOrSurface: "/governance/approval-queue",
    kind: "collection",
    chrome: "operator-empty-state",
    disposition: "centered-justified",
    testId: "governance-workflow-no-approvals",
    componentOrModule: "app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList.tsx",
    notes: "GettingStarted steps are the product — keep OperatorEmptyState until folded (**TB-1556**).",
  },
  {
    id: "projects-recycle-bin-empty",
    pathOrSurface: "/administration/workspace-settings/recycle-bin",
    kind: "collection",
    chrome: "operator-empty-state",
    disposition: "centered-justified",
    testId: "projects-recycle-bin-empty-state",
    componentOrModule: "app/(operator)/administration/workspace-settings/recycle-bin/_sections/ProjectsRecycleBinListStates.tsx",
    notes: "StatusTag + retention copy; nested admin collection — coordinate with **TB-1182**.",
  },
  {
    id: "manifest-detail-no-artifacts",
    pathOrSurface: "/governance/signed-records/[manifestId]",
    kind: "hub-zone",
    chrome: "operator-empty-state",
    disposition: "centered-justified",
    testId: null,
    componentOrModule: "app/(operator)/governance/signed-records/[manifestId]/_sections/ManifestDetailPageView.tsx",
    notes: "Nested deliverables panel empty — not a page-level collection.",
  },
  {
    id: "executive-dashboard-empty",
    pathOrSurface: "/architecture/executive-dashboard",
    kind: "hub-zone",
    chrome: "compact",
    disposition: "compact-native",
    testId: "executive-dashboard-empty-state",
    componentOrModule: "components/executive/ExecutiveDashboardEmptyState.tsx",
    notes: "Buyer-polished Compact CTA to seed/review.",
  },
  {
    id: "operator-home-workspace-empty",
    pathOrSurface: "/",
    kind: "collection",
    chrome: "compact",
    disposition: "compact-native",
    testId: "operator-home-workspace-empty-state",
    componentOrModule: "components/operator-home/OperatorHomeWorkspaceEmptyState.tsx",
    notes: "Preset OPERATOR_HOME_REVIEWS_EMPTY_COMPACT (**TB-1038**).",
  },
] as const;

export function listOperatorEmptyStateMigratedEntries(): readonly OperatorEmptyStateMigrationEntry[] {
  return OPERATOR_EMPTY_STATE_MIGRATION_INVENTORY.filter((entry) => entry.disposition === "migrated");
}

export function listOperatorEmptyStateCompactNativeEntries(): readonly OperatorEmptyStateMigrationEntry[] {
  return OPERATOR_EMPTY_STATE_MIGRATION_INVENTORY.filter((entry) => entry.disposition === "compact-native");
}

export function listOperatorEmptyStateDenseHubEntries(): readonly OperatorEmptyStateMigrationEntry[] {
  return OPERATOR_EMPTY_STATE_MIGRATION_INVENTORY.filter(
    (entry) => entry.disposition === "compact-native" || entry.disposition === "migrated",
  );
}
