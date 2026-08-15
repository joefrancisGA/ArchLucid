/**
 * TB-2288 — Ad-hoc rounded-full status pill inventory → StatusTag migration tracker.
 *
 * Migrated modules must stay free of ad-hoc status-pill class strings (see drift guard TB-2289).
 * Deferred modules remain allowlisted until a follow-on row closes them (**TB-1285**, **TB-1906**–**TB-1920**).
 */

export const TB_2288_MIGRATED_MODULES = [
  "components/AuthPanel.tsx",
  "components/wizard/steps/WizardStepEvidenceUpload.tsx",
  "components/wizard/PilotModePolicyPackToggle.tsx",
] as const;

/** Paths still using ad-hoc pills intentionally (help steppers, nav badges, progress dots, etc.). */
export const TB_2288_DEFERRED_AD_HOC_PILL_MODULES = [
  "app/(operator)/help/_sections/HelpAlertsGuideView.tsx",
  "app/(operator)/help/_sections/HelpCorePilotWorkflowStepper.tsx",
  "app/(operator)/help/_sections/HelpDigestsGuideView.tsx",
  "app/(operator)/help/_sections/HelpGovernanceApprovalGuideView.tsx",
  "app/(operator)/help/_sections/HelpPilotFeedbackGuideView.tsx",
  "app/(operator)/help/_sections/HelpRepeatReviewLoopWorkflowStepper.tsx",
  "app/(operator)/help/_sections/HelpRoiSummaryGuideView.tsx",
  "app/(operator)/help/_sections/HelpRecurrenceSchedulesGuideView.tsx",
  "app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardProtocolSelector.tsx",
  "components/alerts/AlertsOutstandingNavBadge.tsx",
  "components/governance/GovernanceReviewsAwaitingNavBadge.tsx",
  "components/cto-demo/CtoDemoSimulatorTrustBadge.tsx",
  "components/cto-demo/CtoDemoDataSourceBadge.tsx",
  "components/EmailRunToSponsorBanner.tsx",
  "components/CorePilotBuyerStepHint.tsx",
  "components/CorePilotNextStepsCard.tsx",
  "components/ManifestDetailSummaryPanel.tsx",
  "components/usability/NewSinceLastVisitMarker.tsx",
  "app/(operator)/governance/_sections/GovernanceOverviewWorkflowStrip.tsx",
  "app/(marketing)/demo/preview/_sections/DemoPreviewCompactTimeline.tsx",
  "app/(marketing)/signup/verify/SignupVerifyClient.tsx",
  "app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideProgressSummary.tsx",
  "app/(operator)/help/_sections/HelpApiContractsGuideView.tsx",
  "app/(operator)/help/_sections/HelpCliUsageTechnicalReferenceView.tsx",
  "components/AzureExtractorUploadProgressBar.tsx",
  "components/cto-demo/CtoDemoFastCreatePanel.tsx",
  "components/DecisionRegisterTimeline.tsx",
  "components/operator/OperatorFirstRunWorkflowPanel.tsx",
  "components/operator-home/OperatorHomeGlossarySections.tsx",
] as const;
