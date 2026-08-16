import { describe, expect, it } from "vitest";

import { findEffectReadSites } from "@/lib/query/effect-read-scanner";

/**
 * Effects that read from the network and should stay that way. Each entry states why TanStack Query
 * is the wrong owner: a one-shot write, a cache seed, or a call the scanner cannot prove is a read.
 */
const NON_QUERY_SITES: readonly string[] = [
  // Calls a synchronous formatter exported from an api module — no request is issued.
  "src/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligencePageClient.tsx",
  // Creates the draft and seeds form fields once per intake; both effects are guarded by a ref.
  "src/app/(operator)/architecture/reviews/new/use-guided-intake-draft-workflow.ts",
  // Exchanges the OAuth authorization code exactly once; replaying it on a refetch would fail.
  "src/app/(operator)/auth/callback/CallbackClient.tsx",
  // Completes ITSM OAuth consent exactly once, same single-use code constraint.
  "src/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient.tsx",
  // Starts a demo review — a write, not a read.
  "src/components/cto-demo/CtoDemoLiveRunProgressRail.tsx",
  // Advances the first-run checklist — a write.
  "src/components/operator/OperatorFirstRunWorkflowPanel.tsx",
  // Installs query-cache persistence; the matched call touches storage, not the network.
  "src/components/operator/OperatorQueryProvider.tsx",
  // Seeds the query cache from server-rendered shell status.
  "src/components/shell/OperatorShellStatusQueryGate.tsx",
];

/**
 * Reads still fetched by hand that belong in TanStack Query. This list may shrink, never grow:
 * migrating a module means deleting its entry here.
 */
const MIGRATION_BACKLOG: readonly string[] = [
  "src/app/(marketing)/quick-scan/QuickScanClient.tsx",
  "src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.tsx",
  "src/app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailAiRefinePanel.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailBuyerPilotConversionSection.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRetrievalGroundingSection.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectPolicyRuleCallout.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageClient.tsx",
  "src/app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.tsx",
  "src/app/(operator)/architecture/reviews/new/use-new-run-wizard-mode.ts",
  "src/app/(operator)/governance/decision-register/DecisionRegisterClient.tsx",
  "src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx",
  "src/app/(operator)/governance/policy-packs/_sections/PolicyPackVisualBuilder.tsx",
  "src/app/(operator)/governance/policy-packs/_sections/use-policy-packs-page.ts",
  "src/app/(operator)/governance/policy-packs/[id]/PolicyPackDetailClient.tsx",
  "src/app/(operator)/help/_sections/HelpBillingCurrentPlanCard.tsx",
  "src/app/(operator)/help/_sections/HelpTopicMarkdownClient.tsx",
  "src/app/(operator)/help/HelpDocsClient.tsx",
  "src/app/(operator)/insights/compare-two-reviews/_sections/useCompareFindingCorrelation.ts",
  "src/app/(operator)/insights/compare-two-reviews/_sections/useCompareGovernanceDiff.ts",
  "src/app/(operator)/insights/compare-two-reviews/_sections/useComparePolicyPackCloudMismatch.ts",
  "src/app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationPageClient.tsx",
  "src/app/(operator)/why-archlucid/_sections/WhyArchLucidPage.tsx",
  "src/components/advisory/CronExpressionBuilder.tsx",
  "src/components/architecture/ArchitectureDraftWorkspace.tsx",
  "src/components/BeforeAfterDeltaPanel.tsx",
  "src/components/dashboard/ExecutiveRoiDashboard.tsx",
  "src/components/digests/DigestsBrowseContent.tsx",
  "src/components/digests/DigestSubscriptionCreateForm.tsx",
  "src/components/digests/DigestSubscriptionsContent.tsx",
  "src/components/draft-intake/DraftIntakeWhatIfBranchPanel.tsx",
  "src/components/EmailRunToSponsorBanner.tsx",
  "src/components/findings/FindingCrossReviewLifecycleHint.tsx",
  "src/components/findings/FindingInspectContextDebugPanel.tsx",
  "src/components/findings/FindingProvenancePanel.tsx",
  "src/components/findings/ReviewDetailPolicyPackImpactSection.tsx",
  "src/components/FirstPilotProofStatusStrip.tsx",
  "src/components/governance/GovernanceQuickApproveButton.tsx",
  "src/components/governance/RecurrenceScheduleActivationSummary.tsx",
  "src/components/help/ScopeHelpCurrentScopePanel.tsx",
  "src/components/marketing/MarketingTierPricingSection.tsx",
  "src/components/operator/OperatorWelcomeOnboarding.tsx",
  "src/components/PilotOutcomeCard.tsx",
  "src/components/pilots/PilotRoiValidationHandoffCard.tsx",
  "src/components/policy/PolicyRulePreviewDialog.tsx",
  "src/components/QualityGateMetricsTile.tsx",
  "src/components/reviews/RunDetailFirstScreenProofStatusClient.tsx",
  "src/components/runs/RunDetailAiReadinessGateCard.tsx",
  "src/components/runs/RunProgressTracker.tsx",
  "src/components/trial/TrialWelcomeRunDeepLink.tsx",
  "src/components/ValueRealizationDashboard.tsx",
  "src/components/wizard/RunWizardCostPreviewCard.tsx",
  "src/components/wizard/steps/WizardStepAdvanced.tsx",
  "src/hooks/use-prior-same-request-compare-href.ts",
];

const RECORDED_SITES: readonly string[] = [...NON_QUERY_SITES, ...MIGRATION_BACKLOG];

function sorted(paths: readonly string[]): readonly string[] {
  return [...paths].sort((left, right) => left.localeCompare(right));
}

describe("effect-driven reads", () => {
  const detectedPaths = sorted(findEffectReadSites().map((site) => site.path));

  it("classifies each recorded site exactly once", () => {
    const duplicated = NON_QUERY_SITES.filter((path) => MIGRATION_BACKLOG.includes(path));

    expect(duplicated, "a site cannot be both non-query and awaiting migration").toEqual([]);
    expect(new Set(RECORDED_SITES).size).toBe(RECORDED_SITES.length);
  });

  it("records every module that reads inside an effect", () => {
    const unrecorded = detectedPaths.filter((path) => !RECORDED_SITES.includes(path));

    expect(
      unrecorded,
      "these modules read from the network inside useEffect; move the read to a TanStack Query hook, or add the path to NON_QUERY_SITES with the reason it must stay imperative",
    ).toEqual([]);
  });

  it("lists no module that has stopped reading inside an effect", () => {
    const stale = sorted(RECORDED_SITES).filter((path) => !detectedPaths.includes(path));

    expect(
      stale,
      "these paths no longer read inside useEffect (migrated, renamed, or deleted); delete them from this file",
    ).toEqual([]);
  });
});
