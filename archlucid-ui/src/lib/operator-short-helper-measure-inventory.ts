/**
 * TB-2041 — Short operator helper / intro measure inventory + residual allowlist.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § Short operator helper and intro measure (**TB-2038**).
 * Shared chrome defaults: **TB-2039**. Representative hub sweep: **TB-2040**.
 */

/** Paths (relative to `archlucid-ui/`) scanned by the TB-2041 Vitest guard. */
export const OPERATOR_SHORT_HELPER_MEASURE_GUARDED_SOURCES = [
  "src/components/operator/OperatorPageHeader.tsx",
  "src/components/PageHeading.tsx",
  "src/app/(operator)/_sections/OperatorHomePageHeader.tsx",
  "src/components/operator-home/OperatorHomeDualPathCards.tsx",
  "src/components/operator-home/OperatorHomeDoThisNextCard.tsx",
  "src/components/operator-home/OperatorHomeWorkspaceEmptyState.tsx",
  "src/components/operator-home/OperatorHomeExploreSampleSection.tsx",
  "src/components/operator-home/OperatorHomeRecommendedNextAction.tsx",
  "src/app/(operator)/architecture/reviews/_sections/ReviewsHubPackageIncludes.tsx",
  "src/app/(operator)/architecture/reviews/_sections/ReviewsHubRecentPackages.tsx",
  "src/app/(operator)/architecture/reviews/_sections/ReviewsHubResumeDrafts.tsx",
  "src/app/(operator)/architecture/reviews/new/ReviewsNewJobChooserSection.tsx",
  "src/app/(operator)/governance/_sections/GovernanceOverviewPanel.tsx",
  "src/app/(operator)/governance/audit/_sections/AuditPageView.tsx",
  "src/app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx",
  "src/app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageView.tsx",
  "src/app/(operator)/administration/_sections/SettingsPageView.tsx",
  "src/app/(operator)/administration/identity-providers/_sections/IdentityProvidersSettingsShell.tsx",
  "src/components/alerts/AlertRoutingContent.tsx",
  "src/components/evidence-orientation/evidence-orientation-styles.ts",
  "src/components/evidence-orientation/EvidenceOrientationLead.tsx",
  "src/components/evidence-orientation/EvidenceOrientationMetaLine.tsx",
] as const;

/**
 * Residual operator surfaces that may keep `max-w-prose` / `max-w-2xl` / `max-w-3xl` on purpose.
 * Not scanned by the guard — extend only for long reading bodies, form breathing room, or loading chrome.
 */
export const OPERATOR_SHORT_HELPER_MEASURE_RESIDUAL_ALLOWLIST = [
  "src/app/(operator)/help/**",
  "src/app/(marketing)/**",
  "src/components/DocumentLayout.tsx",
  "src/components/operator/OperatorPageContainer.tsx",
  "src/components/operator/OperatorPilotOrientationBanner.tsx",
  "src/components/operator/InviteeFirstOrientationPanel.tsx",
  "src/components/operator/OperatorShellMessage.tsx",
  "src/components/alerts/AlertTuningContent.tsx",
  "src/components/alerts/CompositeAlertRulesContent.tsx",
] as const;

export const OPERATOR_PREMATURE_MEASURE_PATTERN = /max-w-(?:prose|2xl|3xl)/;
