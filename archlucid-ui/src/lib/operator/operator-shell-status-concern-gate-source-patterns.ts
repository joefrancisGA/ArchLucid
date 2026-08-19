/** Operator shell-status concern consumers that must gate fetches (TB-2304 performance). */
export const OPERATOR_SHELL_STATUS_CONCERN_GATE_CONSUMER_RELATIVE_PATHS = [
  "src/components/BeforeAfterDeltaPanel.tsx",
  "src/components/FirstValueReachedCallout.tsx",
  "src/components/TeamExpansionNudge.tsx",
  "src/components/WelcomeBanner.tsx",
  "src/components/alerts/AlertsOutstandingNavBadge.tsx",
  "src/components/llm/LlmBudgetApproachingLimitBanner.tsx",
  "src/components/llm/LlmBudgetStatusPill.tsx",
  "src/components/shell/LlmMonthlyBudgetStatusPollOwner.tsx",
  "src/components/tenancy/TenantMigrationMaintenanceBanner.tsx",
  "src/components/trial/TrialAiBudgetStatusBanner.tsx",
  "src/components/trial/TrialBanner.tsx",
  "src/components/trial/TrialExpiryBanner.tsx",
  "src/components/trial/TrialUsageUpgradeNudge.tsx",
  "src/components/trial/TrialWelcomeRunDeepLink.tsx",
  "src/components/usability/PersistentTrialStatusStrip.tsx",
  "src/hooks/use-assigned-to-me-findings-count-query.ts",
  "src/hooks/use-featured-completed-sample-query.ts",
  "src/hooks/use-governance-reviews-awaiting-action-query.ts",
  "src/hooks/use-operator-stickiness-snapshot-query.ts",
] as const;

export const OPERATOR_SHELL_STATUS_CONCERN_GATE_HOOK_IMPORT =
  "useOperatorShellStatusConcernFetchEnabled";

const CONCERN_FETCH_ENABLED_BINDING_PATTERN = /\b(concernFetchEnabled|queryEnabled)\b/;

export function findOperatorShellStatusConcernGateConsumerViolations(
  source: string,
): readonly string[] {
  const violations: string[] = [];

  if (!source.includes(OPERATOR_SHELL_STATUS_CONCERN_GATE_HOOK_IMPORT)) {
    violations.push(`missing ${OPERATOR_SHELL_STATUS_CONCERN_GATE_HOOK_IMPORT}()`);
  }

  if (!CONCERN_FETCH_ENABLED_BINDING_PATTERN.test(source)) {
    violations.push("missing concernFetchEnabled or queryEnabled binding for gated query enabled flag");
  }

  return violations;
}
