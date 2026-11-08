/**
 * Shared marketing-scale spacing baseline for TB-2390 / operator page density.
 * Keep in sync with `operator-page-spacing-contract.test.ts` MARKETING_SCALE_SPACING_BASELINE.
 */
export const OPERATOR_PAGE_MARKETING_SCALE_SPACING_BASELINE_PATHS: readonly string[] = [
  "app/(operator)/administration/branding/BrandingSettingsFormFields.tsx",
  "app/(operator)/administration/connection-status/AdministrationConnectionStatusPageClient.tsx",
  "app/(operator)/administration/securenow-accessibility/SecureNowAccessibilityPageView.tsx",
  "app/(operator)/administration/securenow-compliance-notes/SecureNowComplianceNotesPageView.tsx",
  "app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx",
  "app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx",
  "app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx",
  "app/(operator)/administration/securenow-quote-packet/SecureNowQuotePacketPageView.tsx",
  "app/(operator)/administration/securenow-return-reasons/SecureNowReturnReasonsPageView.tsx",
  "app/(operator)/administration/securenow-scenario-walks/SecureNowScenarioWalksPageView.tsx",
  "app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.tsx",
  "app/(operator)/administration/securenow-sponsor-path/SecureNowSponsorPathPageView.tsx",
  "app/(operator)/administration/users/_sections/SettingsRolesMatrixSection.tsx",
  "app/(operator)/administration/workspace-settings/_sections/TenantSettingsPageView.tsx",
  "app/(operator)/architecture/architectures/_sections/ArchitecturesHubListSection.tsx",
  "app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx",
] as const;
