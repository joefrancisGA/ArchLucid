import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

/**
 * Components painting notice surfaces with a pastel tint (TB-2379 ratchet baseline).
 *
 * `DESIGN_TOKENS.callout.*` is the canonical recipe: neutral `bg-al-surface-raised` with a
 * coloured border, per the "no decorative pastel card backgrounds" rule in the UI standard.
 * Hand-rolled tints drifted apart — sibling review-intake notices carried `border-amber-300 /
 * text-amber-950` and `border-amber-200 / text-amber-900` for the same severity. This list may
 * shrink but must never grow.
 *
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */
const TINTED_CALLOUT_SURFACE_BASELINE: ReadonlySet<string> = new Set([
  "app/(marketing)/quick-scan/QuickScanClient.tsx",
  "app/(marketing)/quick-scan/QuickScanForm.tsx",
  "app/(operator)/administration/_sections/SettingsMasterDestinationCard.tsx",
  "app/(operator)/administration/ai-usage/_sections/ai-usage/AiUsageRecentActivityPanel.tsx",
  "app/(operator)/administration/api-keys/_sections/ApiKeysSettingsPageClient.tsx",
  "app/(operator)/administration/auth-domains/AuthDomainsPageClient.tsx",
  "app/(operator)/administration/baseline/BaselineSettingsClient.tsx",
  "app/(operator)/administration/support/_sections/AdminSupportPageView.tsx",
  "app/(operator)/administration/users/_sections/SettingsRolesMatrixConfirmDialog.tsx",
  "app/(operator)/administration/users/_sections/SettingsRolesMatrixSection.tsx",
  "app/(operator)/architecture/executive-dashboard/_sections/ExecutiveRoiBoardPackEvidenceBanner.tsx",
  "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailFeasibilityVerdictSection.tsx",
  "app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx",
  "app/(operator)/governance/policy-packs/_sections/PolicyPackGeneratorSection.tsx",
  "app/(operator)/governance/policy-packs/_sections/PolicyPackNaturalLanguageBuilder.tsx",
  "app/(operator)/help/_sections/HelpSoc2SelfAssessmentGuideView.tsx",
  "app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel.tsx",
  "app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffPanel.tsx",
  "app/(operator)/insights/improvement-planning/_sections/PlanningClaimDisciplineCallout.tsx",
  "app/(operator)/insights/roi-summary/_sections/RoiSummaryLoadedHourlyCostField.tsx",
  "app/(operator)/insights/roi-summary/_sections/RoiSummaryPageView.tsx",
  "app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationPageClient.tsx",
  "app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageView.tsx",
  "app/(operator)/internal/configuration/_sections/AdminConfigurationPageView.tsx",
  "app/(operator)/internal/recommendation-learning/_sections/RecommendationLearningOpsPageClient.tsx",
  "app/(operator)/internal/trial-funnel/_sections/TrialFunnelOpsPageClient.tsx",
  "app/(operator)/why-archlucid/_sections/WhyArchLucidPageHeader.tsx",
  "components/BeforeAfterDelta/BeforeAfterDeltaTopPanel.tsx",
  "components/BuyerCtoDemoTourOverlay.tsx",
  "components/ClientRuntimeDiagnostics.tsx",
  "components/FirstValueReachedCallout.tsx",
  "components/GraphNodeKindLegendChips.tsx",
  "components/MutationErrorBoundary.tsx",
  "components/TeamExpansionNudge.tsx",
  "components/alerts/AlertRoutingContent.tsx",
  "components/alerts/AlertRulesContent.tsx",
  "components/architecture/ArchitectureDraftHandoffBanner.tsx",
  "components/architecture/ArchitectureSponsorSharingPanel.tsx",
  "components/architecture/ArchitectureStructuringFailureNotice.tsx",
  "components/compare/ArchitectureManifestUnifiedDiffView.tsx",
  "components/compare/CompareComparisonTrustBanner.tsx",
  "components/cto-demo/CtoDemoCustomerStartError.tsx",
  "components/cto-demo/CtoDemoStaticFallbackPresenterBanner.tsx",
  "components/draft-intake/DraftIntakeDecisionReceiptCard.tsx",
  "components/draft-intake/WhatIfBranchCompareBanner.tsx",
  "components/findings/FindingsWhatIfAnalysisPanel.tsx",
  "components/governance/GovernanceConflictsTable.tsx",
  "components/governance/RecurrenceScheduleActivationActions.tsx",
  "components/llm/LlmBudgetApproachingLimitBanner.tsx",
  "components/operator-home/OperatorHomeGlossarySections.tsx",
  "components/operator/OperatorDemoStaticBanner.tsx",
  "components/policy/PolicyPackComplianceRuleKeyDiffView.tsx",
  "components/policy/PolicyPackImpactPreviewPanel.tsx",
  "components/quick-decision-summary/QuickDecisionSummaryCardView.tsx",
  "components/quick-decision-summary/QuickDecisionSummaryWorkspaceView.tsx",
  "components/replay/ReplayValidationImpactSummary.tsx",
  "components/reviews/ReviewAgentExecutionLogSection.tsx",
  "components/reviews/RunDetailFirstScreenProofStatusClient.tsx",
  "components/tenancy/TenantCatalogMigrationDiagnosticsSection.tsx",
  "components/trial/TrialBanner.tsx",
  "components/trial/TrialExpiryBanner.tsx",
  "components/trial/TrialUsageUpgradeNudge.tsx",
  "components/usability/DemoVsLiveChromeBanner.tsx",
  "components/usability/ExecutiveConfidenceLabel.tsx",
  "components/wizard/RunWizardCostPreviewCard.tsx",
]);

const TINTED_CALLOUT_SURFACE = /\bbg-(?:amber|emerald|rose|green|sky)-(?:50|100)\b/;

function collectComponentFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectComponentFiles(absolute));
      continue;
    }

    if (extname(absolute) === ".tsx" && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

function usesTintedCalloutSurface(absolute: string): boolean {
  return TINTED_CALLOUT_SURFACE.test(readFileSync(absolute, "utf8"));
}

describe("notice callout surfaces (TB-2379)", () => {
  it("keeps pastel-tinted callout surfaces inside the frozen baseline", () => {
    const offenders = collectComponentFiles(SRC_ROOT)
      .filter(usesTintedCalloutSurface)
      .map(toPosixRelativePath)
      .filter((path) => !TINTED_CALLOUT_SURFACE_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that were already migrated", () => {
    const stale = [...TINTED_CALLOUT_SURFACE_BASELINE]
      .filter((path) => !usesTintedCalloutSurface(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
