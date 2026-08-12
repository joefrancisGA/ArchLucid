/**
 * Shared marketing-scale spacing baseline for TB-2390 / operator page density.
 * Keep in sync with `operator-page-spacing-contract.test.ts` MARKETING_SCALE_SPACING_BASELINE.
 */
export const OPERATOR_PAGE_MARKETING_SCALE_SPACING_BASELINE_PATHS: readonly string[] = [
  "app/(operator)/administration/_sections/SettingsPageView.tsx",
  "app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx",
  "app/(operator)/administration/identity-providers/_sections/IdentityProvidersSettingsShell.tsx",
  "app/(operator)/administration/tenant/_sections/TenantSettingsPageView.tsx",
  "app/(operator)/administration/users/_sections/SettingsRolesPageView.tsx",
  "app/(operator)/architecture/reviews/[runId]/findings/[findingId]/FindingInspectGovernanceStickinessPanel.tsx",
  "app/(operator)/architecture/reviews/[runId]/findings/[findingId]/FindingInspectView.tsx",
  "app/(operator)/architecture/reviews/new/NewRunWizardClient.tsx",
  "app/(operator)/architecture/reviews/new/SimplifiedPilotWizard.tsx",
  "app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx",
  "app/(operator)/governance/_sections/GovernanceOverviewPanel.tsx",
  "app/(operator)/governance/signed-records/[manifestId]/_sections/ManifestDetailPageView.tsx",
  "app/(operator)/governance/signed-records/[manifestId]/artifacts/[artifactId]/_sections/SignedRecordArtifactPageView.tsx",
  "app/(operator)/insights/pilot-outcomes/_sections/PilotValueReportPageView.tsx",
  "app/(operator)/internal/recommendation-learning/_sections/RecommendationLearningOpsPageClient.tsx",
  "app/(operator)/internal/trial-funnel/_sections/TrialFunnelOpsPageClient.tsx",
] as const;
