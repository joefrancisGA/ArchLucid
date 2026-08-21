import dynamic from "next/dynamic";
import type { ComponentType, JSX } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";
import { deferredChunkLoader } from "@/lib/import-deferred-chunk-with-retry";
import {
  deferredChunkManifestEntry,
  type DeferredChunkManifestEntry,
} from "@/lib/operator/deferred-chunk-manifest";
import { ALERT_RULES_HUB_CHUNK_MANIFEST } from "@/lib/operator/alert-rules-hub-chunk-manifest";
import { ALERTS_INBOX_CHUNK_MANIFEST } from "@/lib/operator/alerts-inbox-chunk-manifest";
import { APP_SHELL_CHUNK_MANIFEST } from "@/lib/operator/app-shell-chunk-manifest";
import { GOVERNANCE_WORKFLOW_CHUNK_MANIFEST } from "@/lib/operator/governance-workflow-chunk-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";
import { OPERATOR_SHELL_TOP_BAR_CHUNK_MANIFEST } from "@/lib/operator/operator-shell-top-bar-chunk-manifest";
import { POLICY_PACKS_AUTHORING_CHUNK_MANIFEST } from "@/lib/operator/policy-packs-authoring-chunk-manifest";
import { REVIEWS_HUB_CHUNK_MANIFEST } from "@/lib/operator/reviews-hub-chunk-manifest";
import { RUN_DETAIL_CHUNK_MANIFEST } from "@/lib/operator/run-detail-chunk-manifest";
import { SIGNED_RECORDS_LIST_CHUNK_MANIFEST } from "@/lib/operator/signed-records-list-chunk-manifest";
import { SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST } from "@/lib/operator/sponsor-roi-dashboard-chunk-manifest";

export type LoadDeferredChunkFromManifestOptions = {
  readonly ssr?: boolean;
  readonly loadingClassName?: string;
  readonly loadingTestId?: string;
  readonly loadingWrapper?: (loading: JSX.Element) => JSX.Element;
  readonly suppressLoading?: boolean;
};

function requireDeferredChunkManifestEntry(entryId: string): DeferredChunkManifestEntry {
  const entry = deferredChunkManifestEntry(entryId);

  if (entry === undefined) {
    throw new Error(`Unknown deferred chunk manifest entry "${entryId}".`);
  }

  return entry;
}

/** Static import map so webpack can split deferred chunks predictably. */
function resolveDeferredChunkImportLoader(
  entryId: string,
): () => Promise<ComponentType<Record<string, unknown>>> {
  switch (entryId) {
    case "operator-home-command-center":
      return deferredChunkLoader(() =>
        import("@/components/usability/PilotCommandCenterCard").then(
          (module) => module.PilotCommandCenterCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-hero":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/BuyerPolishedHomeHeroSection").then(
          (module) => module.BuyerPolishedHomeHeroSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-gate":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeGate").then((module) => module.OperatorHomeGate),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-below-fold":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/_sections/OperatorHomeBelowFoldPanels").then(
          (module) => module.OperatorHomeBelowFoldPanels,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-stickiness":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeStickinessCockpit").then(
          (module) => module.OperatorHomeStickinessCockpit,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-sponsor-roi":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeSponsorRoiStrip").then(
          (module) => module.OperatorHomeSponsorRoiStrip,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-runs-dashboard":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/RunsDashboardPanel").then(
          (module) => module.RunsDashboardPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-cto-demo-sponsor-landing":
      return deferredChunkLoader(() =>
        import("@/components/cto-demo/CtoDemoSponsorLandingRedirect").then(
          (module) => module.CtoDemoSponsorLandingRedirect,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-advanced-guidance":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeAdvancedGuidanceSection").then(
          (module) => module.OperatorHomeAdvancedGuidanceSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-overview-panel":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/_sections/GovernanceOverviewPanel").then(
          (module) => module.GovernanceOverviewPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-review-context-bar":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/_sections/GovernanceReviewContextBar").then(
          (module) => module.GovernanceReviewContextBar,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-approvals-list":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList").then(
          (module) => module.GovernanceWorkflowApprovalsList,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-submit-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/_sections/GovernanceWorkflowSubmitSection").then(
          (module) => module.GovernanceWorkflowSubmitSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-promotions-activations":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/_sections/GovernanceWorkflowPromotionsActivationsSection").then(
          (module) => module.GovernanceWorkflowPromotionsActivationsSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-dialogs":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/_sections/GovernanceWorkflowDialogs").then(
          (module) => module.GovernanceWorkflowDialogs,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-interactive-quickstart":
      return deferredChunkLoader(() =>
        import("@/components/governance/GovernanceInteractiveQuickstartContent").then(
          (module) => module.GovernanceInteractiveQuickstartContent,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-approval-story-card":
      return deferredChunkLoader(() =>
        import("@/components/governance/GovernanceApprovalStoryCard").then(
          (module) => module.GovernanceApprovalStoryCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-advanced-options":
      return deferredChunkLoader(() =>
        import("@/components/AdvancedOptionsAccordion").then((module) => module.AdvancedOptionsAccordion),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-cto-demo-buyer-value-strip":
      return deferredChunkLoader(() =>
        import("@/components/cto-demo/CtoDemoBuyerValueStrip").then(
          (module) => module.CtoDemoBuyerValueStrip,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-cto-demo-segregation-callout":
      return deferredChunkLoader(() =>
        import("@/components/cto-demo/CtoDemoSegregationCallout").then(
          (module) => module.CtoDemoSegregationCallout,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "governance-workflow-cto-demo-governance-preview-hint":
      return deferredChunkLoader(() =>
        import("@/components/OperateCapabilityHints").then((module) => module.CtoDemoGovernancePreviewHint),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "policy-packs-authoring-wizard":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/policy-packs/_sections/PolicyRuleAuthoringWizard").then(
          (module) => module.PolicyRuleAuthoringWizard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "policy-packs-authoring-natural-language-builder":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/policy-packs/_sections/PolicyPackNaturalLanguageBuilder").then(
          (module) => module.PolicyPackNaturalLanguageBuilder,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "policy-packs-authoring-visual-builder":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/policy-packs/_sections/PolicyPackVisualBuilder").then(
          (module) => module.PolicyPackVisualBuilder,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "alert-rules-hub-conditions":
      return deferredChunkLoader(() =>
        import("@/components/alerts/AlertRulesContent").then((module) => module.AlertRulesContent),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "alert-rules-hub-routing":
      return deferredChunkLoader(() =>
        import("@/components/alerts/AlertRoutingContent").then((module) => module.AlertRoutingContent),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "alert-rules-hub-composite-rules":
      return deferredChunkLoader(() =>
        import("@/components/alerts/CompositeAlertRulesContent").then(
          (module) => module.CompositeAlertRulesContent,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "alert-rules-hub-simulation-tuning":
      return deferredChunkLoader(() =>
        import("@/components/alerts/AlertSimulationTuningSection").then(
          (module) => module.AlertSimulationTuningSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "signed-records-list-table":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/governance/sealed-records/_sections/SignedRecordsListTable").then(
          (module) => module.SignedRecordsListTable,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-next-action":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardNextActionSection").then(
          (module) => module.SponsorDashboardNextActionSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-primary-metrics":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardPrimaryMetricsSection").then(
          (module) => module.SponsorDashboardPrimaryMetricsSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-how-it-works":
      return deferredChunkLoader(() =>
        import("@/components/sponsor/SponsorDashboardHowItWorks").then(
          (module) => module.SponsorDashboardHowItWorks,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-exports":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorExportsSection").then(
          (module) => module.SponsorExportsSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-business-impact":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/sponsor-dashboard/_sections/BusinessImpactSummaryWidget").then(
          (module) => module.BusinessImpactSummaryWidget,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-roi-summary":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiSummarySection").then(
          (module) => module.SponsorRoiSummarySection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-compliance-drift-trend":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorComplianceDriftTrendSection").then(
          (module) => module.SponsorComplianceDriftTrendSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-welcome-onboarding":
      return deferredChunkLoader(() =>
        import("@/components/operator/OperatorWelcomeOnboarding").then(
          (module) => module.OperatorWelcomeOnboarding,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-roi-trend":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiTrendSection").then(
          (module) => module.SponsorRoiTrendSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-environment-savings":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiEnvironmentSavingsSection").then(
          (module) => module.SponsorRoiEnvironmentSavingsSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-supporting-metrics":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardSupportingMetricsSection").then(
          (module) => module.SponsorDashboardSupportingMetricsSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "sponsor-roi-dashboard-workspace-health":
      return deferredChunkLoader(() =>
        import("@/components/SponsorWorkspaceHealthDashboard").then(
          (module) => module.SponsorWorkspaceHealthDashboard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "alerts-inbox-governance-context-panel":
      return deferredChunkLoader(() =>
        import("@/components/alerts/AlertsGovernanceContextPanel").then(
          (module) => module.AlertsGovernanceContextPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "alerts-inbox-dialogs":
      return deferredChunkLoader(() =>
        import("@/components/alerts/AlertsInboxDialogs").then((module) => module.AlertsInboxDialogs),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-workspace-footer":
      return deferredChunkLoader(() =>
        import("@/components/shell/AppShellWorkspaceFooter").then((module) => module.AppShellWorkspaceFooter),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-idle-overlays":
      return deferredChunkLoader(() =>
        import("@/components/shell/AppShellIdleOverlays").then((module) => module.AppShellIdleOverlays),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-dev-testing-shortcuts":
      return deferredChunkLoader(() =>
        import("@/components/dev-testing/DevTestingShellShortcuts").then(
          (module) => module.DevTestingShellShortcuts,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-telemetry-bundle":
      return deferredChunkLoader(() =>
        import("@/components/shell/AppShellTelemetryBundle").then((module) => module.AppShellTelemetryBundle),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-session-idle-timeout":
      return deferredChunkLoader(() =>
        import("@/components/SessionIdleTimeoutGuard").then((module) => module.SessionIdleTimeoutGuard),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-auth-panel":
      return deferredChunkLoader(() =>
        import("@/components/AuthPanel").then((module) => module.AuthPanel),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-sync-active-run":
      return deferredChunkLoader(() =>
        import("@/components/SyncActiveRunFromPathname").then((module) => module.SyncActiveRunFromPathname),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-main-content-gate":
      return deferredChunkLoader(() =>
        import("@/components/shell/AppShellMainContentGate").then((module) => module.AppShellMainContentGate),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-access-redirects-host":
      return deferredChunkLoader(() =>
        import("@/components/shell/OperatorShellAccessRedirectsHost").then(
          (module) => module.OperatorShellAccessRedirectsHost,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-toaster":
      return deferredChunkLoader(() =>
        import("@/components/AppToaster").then((module) => module.AppToaster),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-route-announcer":
      return deferredChunkLoader(() =>
        import("@/components/RouteAnnouncer").then((module) => module.RouteAnnouncer),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-shell-top-bar":
      return deferredChunkLoader(() =>
        import("@/components/shell/OperatorShellTopBar").then((module) => module.OperatorShellTopBar),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-keyboard-shortcut-boundary":
      return deferredChunkLoader(() =>
        import("@/components/shell/AppShellKeyboardShortcutBoundary").then(
          (module) => module.AppShellKeyboardShortcutBoundary,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-color-mode-toggle":
      return deferredChunkLoader(() =>
        import("@/components/ColorModeToggle").then((module) => module.ColorModeToggle),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-authority-theme-toggle":
      return deferredChunkLoader(() =>
        import("@/components/AuthorityThemeToggle").then((module) => module.AuthorityThemeToggle),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "app-shell-theme-preferences-vocabulary-rail":
      return deferredChunkLoader(() =>
        import("@/components/ShellThemePreferencesAppearanceVocabularyRail").then(
          (module) => module.ShellThemePreferencesAppearanceVocabularyRail,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-shell-top-bar-global-search":
      return deferredChunkLoader(() =>
        import("@/components/GlobalSearchBar").then((module) => module.GlobalSearchBar),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-shell-top-bar-mobile-nav-drawer":
      return deferredChunkLoader(() =>
        import("@/components/MobileNavDrawer").then((module) => module.MobileNavDrawer),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-shell-top-bar-scope-switcher":
      return deferredChunkLoader(() =>
        import("@/components/ScopeSwitcher").then((module) => module.ScopeSwitcher),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-shell-top-bar-in-flight-operations":
      return deferredChunkLoader(() =>
        import("@/components/shell/ShellInFlightOperationsAffordance").then(
          (module) => module.ShellInFlightOperationsAffordance,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-shell-top-bar-more-menu":
      return deferredChunkLoader(() =>
        import("@/components/shell/OperatorShellTopBarMoreMenu").then(
          (module) => module.OperatorShellTopBarMoreMenu,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-shell-top-bar-account-settings":
      return deferredChunkLoader(() =>
        import("@/components/shell/AccountSettingsMenu").then((module) => module.AccountSettingsMenu),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-inventory":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubReviewInventory").then(
          (module) => module.ReviewsHubReviewInventory,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-welcome-onboarding":
      return deferredChunkLoader(() =>
        import("@/components/operator/OperatorWelcomeOnboarding").then(
          (module) => module.OperatorWelcomeOnboarding,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-explore-samples":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubExploreSamples").then(
          (module) => module.ReviewsHubExploreSamples,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-package-includes":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubPackageIncludes").then(
          (module) => module.ReviewsHubPackageIncludes,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-before-after-delta":
      return deferredChunkLoader(() =>
        import("@/components/BeforeAfterDeltaPanel").then((module) => module.BeforeAfterDeltaPanel),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-index-before-after":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunsIndexBeforeAfterPanel").then(
          (module) => module.RunsIndexBeforeAfterPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-list-error-boundary":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunsListAggregateErrorBoundary").then(
          (module) => module.RunsListAggregateErrorBoundary,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-workspace-shell":
      return deferredChunkLoader(() =>
        import("@/components/reviews/ReviewWorkspaceShell").then((module) => module.ReviewWorkspaceShell),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-overview-panel":
      return deferredChunkLoader(() =>
        import("@/components/reviews/RunDetailOverviewPanelClient").then(
          (module) => module.RunDetailOverviewPanelClient,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-evidence-tab":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailEvidenceTabPanel").then(
          (module) => module.RunDetailEvidenceTabPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-below-fold":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailBelowFoldSections").then(
          (module) => module.RunDetailBelowFoldSections,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-architecture-created-workspace":
      return deferredChunkLoader(() =>
        import("@/components/architecture/ArchitectureCreatedReviewWorkspaceShell").then(
          (module) => module.ArchitectureCreatedReviewWorkspaceShell,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-create-home-evidence":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeEvidencePanel").then(
          (module) => module.RunDetailCreateHomeEvidencePanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-create-home-activity":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeActivityPanel").then(
          (module) => module.RunDetailCreateHomeActivityPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-technology-baseline":
      return deferredChunkLoader(() =>
        import("@/components/reviews/technology-baseline/TechnologyBaselineSection").then(
          (module) => module.TechnologyBaselineSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-changes-since-last-review":
      return deferredChunkLoader(() =>
        import("@/components/ChangesSinceLastReviewBanner").then(
          (module) => module.ChangesSinceLastReviewBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-savings-summary":
      return deferredChunkLoader(() =>
        import("@/components/RunSavingsSummary").then((module) => module.RunSavingsSummary),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-decision-delta":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailDecisionDeltaPanel").then(
          (module) => module.RunDetailDecisionDeltaPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-explanation-collapsible":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRunExplanationCollapsible").then(
          (module) => module.RunDetailRunExplanationCollapsible,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-activity-sources":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailActivitySourcesPanel").then(
          (module) => module.RunDetailActivitySourcesPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-workspace-header":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome").then(
          (module) => module.RunDetailWorkspaceHeader,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-workspace-summary-strip":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceSummaryStripTabAware").then(
          (module) => module.RunDetailWorkspaceSummaryStripTabAware,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-workspace-blocking-banner":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome").then(
          (module) => module.RunDetailWorkspaceBlockingBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-workspace-sticky-actions":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceStickyActions").then(
          (module) => module.RunDetailWorkspaceStickyActions,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-section-nav":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunDetailSectionNav").then((module) => module.RunDetailSectionNav),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-outcome-cards":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunDetailOutcomeCards").then((module) => module.RunDetailOutcomeCards),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-artifacts-exports-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection").then(
          (module) => module.RunDetailArtifactsExportsSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-operator-technical-forensics":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailOperatorTechnicalForensicsPanel").then(
          (module) => module.RunDetailOperatorTechnicalForensicsPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-sponsor-bottom-line":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailSponsorBottomLine").then(
          (module) => module.RunDetailSponsorBottomLine,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-package-do-this-next-resolved":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageDoThisNextResolved").then(
          (module) => module.RunDetailReviewPackageDoThisNextResolved,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-package-sponsor-handoff-gate":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageSponsorHandoffGate").then(
          (module) => module.RunDetailReviewPackageSponsorHandoffGate,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-help-page-situation-registrar":
      return deferredChunkLoader(() =>
        import("@/components/help/HelpPageSituationRegistrar").then(
          (module) => module.HelpPageSituationRegistrar,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-generation-created-notice":
      return deferredChunkLoader(() =>
        import("@/components/review-intake/ReviewGenerationCreatedNotice").then(
          (module) => module.ReviewGenerationCreatedNotice,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-progress-tracker":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunProgressTracker").then((module) => module.RunProgressTracker),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-estimated-llm-cost-card":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunEstimatedLlmCostCard").then((module) => module.RunEstimatedLlmCostCard),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-capture-evidence-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCaptureEvidenceSection").then(
          (module) => module.RunDetailCaptureEvidenceSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-manifest-summary-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailManifestSummarySection").then(
          (module) => module.RunDetailManifestSummarySection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-agent-results-summary-card":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunAgentResultsSummaryCard").then(
          (module) => module.RunAgentResultsSummaryCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-agent-execution-log-section":
      return deferredChunkLoader(() =>
        import("@/components/reviews/ReviewAgentExecutionLogSection").then(
          (module) => module.ReviewAgentExecutionLogSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-retrieval-grounding-summary-card":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunRetrievalGroundingSummaryCard").then(
          (module) => module.RunRetrievalGroundingSummaryCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-run-metadata-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRunMetadataSection").then(
          (module) => module.RunDetailRunMetadataSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-last-failure-card":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunDetailLastFailureCard").then((module) => module.RunDetailLastFailureCard),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-trust-evidence-card-section":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunTrustEvidenceCardSection").then(
          (module) => module.RunTrustEvidenceCardSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-sample-review-package-summary":
      return deferredChunkLoader(() =>
        import("@/components/SampleReviewPackageSummary").then((module) => module.SampleReviewPackageSummary),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-architecture-create-work-item-section":
      return deferredChunkLoader(() =>
        import("@/components/architecture/ArchitectureCreateWorkItemSection").then(
          (module) => module.ArchitectureCreateWorkItemSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-architecture-sponsor-sharing-panel":
      return deferredChunkLoader(() =>
        import("@/components/architecture/ArchitectureSponsorSharingPanel").then(
          (module) => module.ArchitectureSponsorSharingPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-first-week-route-guidance":
      return deferredChunkLoader(() =>
        import("@/components/FirstWeekRouteGuidance").then((module) => module.FirstWeekRouteGuidance),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-cold-open-orientation":
      return deferredChunkLoader(() =>
        import("@/components/reviews/RunDetailColdOpenOrientationClient").then(
          (module) => module.RunDetailColdOpenOrientationClient,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-explanation-confidence-banner":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunExplanationConfidenceBanner").then(
          (module) => module.RunExplanationConfidenceBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-governance-alerts":
      return deferredChunkLoader(() =>
        import("@/components/reviews/RunDetailGovernanceAlerts").then((module) => module.RunDetailGovernanceAlerts),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-what-if-branch-compare-banner":
      return deferredChunkLoader(() =>
        import("@/components/draft-intake/WhatIfBranchCompareBanner").then(
          (module) => module.WhatIfBranchCompareBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-commit-blocking-findings-banner":
      return deferredChunkLoader(() =>
        import("@/components/usability/CommitBlockingFindingsBanner").then(
          (module) => module.CommitBlockingFindingsBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-stalled-review-guidance-callout":
      return deferredChunkLoader(() =>
        import("@/components/usability/StalledReviewGuidanceCallout").then(
          (module) => module.StalledReviewGuidanceCallout,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-cto-demo-review-route-guard":
      return deferredChunkLoader(() =>
        import("@/components/cto-demo/CtoDemoReviewRouteGuard").then((module) => module.CtoDemoReviewRouteGuard),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-policy-pack-impact-callout":
      return deferredChunkLoader(() =>
        import("@/components/findings/ReviewDetailPolicyPackImpactSection").then(
          (module) => module.ReviewDetailPolicyPackImpactSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-tabbed-section-nav":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunDetailTabbedSectionNav").then((module) => module.RunDetailTabbedSectionNav),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-before-after-delta-panel":
      return deferredChunkLoader(() =>
        import("@/components/BeforeAfterDeltaPanel").then((module) => module.BeforeAfterDeltaPanel),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-recurrence-schedule-post-commit-card":
      return deferredChunkLoader(() =>
        import("@/components/governance/RecurrenceSchedulePostCommitCard").then(
          (module) => module.RecurrenceSchedulePostCommitCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-retrieval-grounding-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRetrievalGroundingSection").then(
          (module) => module.RunDetailRetrievalGroundingSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-advanced-analysis-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailAdvancedAnalysisSection").then(
          (module) => module.RunDetailAdvancedAnalysisSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-sponsor-report-cta-card":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailExecutiveSummaryCtaCard").then(
          (module) => module.RunDetailSponsorReportCtaCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-package-primary-action":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackagePrimaryActionTabAware").then(
          (module) => module.ReviewPackagePrimaryActionTabAware,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-package-sponsor-handoff-strip":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageSponsorHandoffStrip").then(
          (module) => module.ReviewPackageSponsorHandoffStrip,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-package-do-this-next-strip":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip").then(
          (module) => module.ReviewPackageDoThisNextStrip,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-governance-decision-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailGovernanceDecisionSection").then(
          (module) => module.RunDetailGovernanceDecisionSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-package-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageSection").then(
          (module) => module.RunDetailReviewPackageSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-submitted-architecture-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailSubmittedArchitectureSection").then(
          (module) => module.RunDetailSubmittedArchitectureSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-governance-cta":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailGovernanceCta").then(
          (module) => module.RunDetailGovernanceCta,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-buyer-pilot-conversion-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailBuyerPilotConversionSection").then(
          (module) => module.RunDetailBuyerPilotConversionSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-buyer-mode-fallback-banner":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailBuyerModeFallbackBanner").then(
          (module) => module.RunDetailBuyerModeFallbackBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-package-share-row":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageShareRow").then(
          (module) => module.RunDetailReviewPackageShareRow,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-demo-marketing-chrome":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailDemoMarketingChrome").then(
          (module) => module.RunDetailDemoMarketingChrome,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-manifest-summary-alerts":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailManifestSummaryAlerts").then(
          (module) => module.RunDetailManifestSummaryAlerts,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-holistic-critic-panel":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailHolisticCriticPanel").then(
          (module) => module.RunDetailHolisticCriticPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-run-actions-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRunActionsSection").then(
          (module) => module.RunDetailRunActionsSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-golden-sponsor-walkthrough":
      return deferredChunkLoader(() =>
        import("@/components/golden-walkthrough/GoldenSponsorPackageWalkthroughDestination").then(
          (module) => module.GoldenSponsorPackageWalkthroughDestination,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-export-deliverable-dialog":
      return deferredChunkLoader(() =>
        import("@/components/usability/ExportDeliverableDialog").then(
          (module) => module.ExportDeliverableDialog,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-generate-adr-from-run-modal":
      return deferredChunkLoader(() =>
        import("@/components/GenerateAdrFromRunModal").then((module) => module.GenerateAdrFromRunModal),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-compare-to-baseline-cta":
      return deferredChunkLoader(() =>
        import("@/components/CompareToBaselineCta").then((module) => module.CompareToBaselineCta),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-post-commit-habit-loop":
      return deferredChunkLoader(() =>
        import("@/components/PostCommitHabitLoopCard").then((module) => module.PostCommitHabitLoopCard),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-architecture-graph-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArchitectureGraphSection").then(
          (module) => module.RunDetailArchitectureGraphSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    default:
      throw new Error(`No deferred chunk import loader registered for manifest entry "${entryId}".`);
  }
}

/** TB-2371 — retry-aware dynamic import loader keyed by manifest entry id. */
export function loadDeferredChunkFromManifest(
  entryId: string,
): () => Promise<ComponentType<Record<string, unknown>>> {
  requireDeferredChunkManifestEntry(entryId);

  return resolveDeferredChunkImportLoader(entryId);
}

/** TB-2371 — `next/dynamic` wrapper driven by deferred chunk manifest metadata. */
export function createDeferredComponentFromManifest<P extends Record<string, unknown> = Record<string, unknown>>(
  entryId: string,
  options: LoadDeferredChunkFromManifestOptions = {},
): ComponentType<P> {
  const entry = requireDeferredChunkManifestEntry(entryId);
  const loader = loadDeferredChunkFromManifest(entryId);

  return dynamic(loader, {
    ssr: options.ssr ?? false,
    loading: options.suppressLoading
      ? () => null
      : () => {
          const loading = (
            <DeferredChunkLoading
              label={entry.label}
              variant={entry.variant}
              testId={options.loadingTestId ?? `${entry.id}-deferred-chunk-loading`}
              className={options.loadingClassName}
            />
          );

          if (options.loadingWrapper !== undefined) {
            return options.loadingWrapper(loading);
          }

          return loading;
        },
  }) as ComponentType<P>;
}

/** Operator-home manifest ids that have registered import loaders (manifest import-test guard). */
export const OPERATOR_HOME_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = OPERATOR_HOME_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Reviews-hub manifest ids that have registered import loaders (manifest import-test guard). */
export const REVIEWS_HUB_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = REVIEWS_HUB_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Run-detail manifest ids that have registered import loaders (manifest import-test guard). */
export const RUN_DETAIL_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = RUN_DETAIL_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Governance-workflow manifest ids that have registered import loaders (manifest import-test guard). */
export const GOVERNANCE_WORKFLOW_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  GOVERNANCE_WORKFLOW_CHUNK_MANIFEST.map((entry) => entry.id);

/** Policy-packs authoring manifest ids that have registered import loaders (manifest import-test guard). */
export const POLICY_PACKS_AUTHORING_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  POLICY_PACKS_AUTHORING_CHUNK_MANIFEST.map((entry) => entry.id);

/** Alert-rules hub manifest ids that have registered import loaders (manifest import-test guard). */
export const ALERT_RULES_HUB_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  ALERT_RULES_HUB_CHUNK_MANIFEST.map((entry) => entry.id);

/** Signed-records list manifest ids that have registered import loaders (manifest import-test guard). */
export const SIGNED_RECORDS_LIST_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  SIGNED_RECORDS_LIST_CHUNK_MANIFEST.map((entry) => entry.id);

/** Sponsor ROI dashboard manifest ids that have registered import loaders (manifest import-test guard). */
export const SPONSOR_ROI_DASHBOARD_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST.map((entry) => entry.id);

/** Alerts inbox manifest ids that have registered import loaders (manifest import-test guard). */
export const ALERTS_INBOX_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = ALERTS_INBOX_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** App shell manifest ids that have registered import loaders (manifest import-test guard). */
export const APP_SHELL_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = APP_SHELL_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Operator shell top bar manifest ids that have registered import loaders (manifest import-test guard). */
export const OPERATOR_SHELL_TOP_BAR_DEFERRED_CHUNK_LOADER_IDS: readonly string[] =
  OPERATOR_SHELL_TOP_BAR_CHUNK_MANIFEST.map((entry) => entry.id);
