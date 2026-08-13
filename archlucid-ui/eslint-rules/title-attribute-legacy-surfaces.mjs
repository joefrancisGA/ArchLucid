/**
 * Baseline for the `title`-attribute-as-help ban (UI_DESIGN_SYSTEM.md § Operator page contextual
 * help — mount + interaction contract, TB-1666).
 *
 * These 68 files carried a native `title` attribute when the rule landed on 2026-08-09. The rule is
 * an error everywhere else so new hover-only help cannot be introduced; this list exists only so the
 * rule could land without a 135-site refactor in one change. Sweeping it is TB-2147.
 *
 * Three distinct patterns are baselined here, and they do not all have the same fix:
 *   1. Fake tooltips — `<span className="cursor-help underline decoration-dotted" title={…}>`.
 *      Replace with `FieldHelpTooltip` (short hint) or `HelpPopover` (anything interactive).
 *   2. Disabled-reason copy — `title={disabled ? whyDisabled : undefined}`. The reason must become
 *      visible near the control; a mouse-only explanation of why a button cannot be pressed is a
 *      dead end for keyboard and touch users.
 *   3. Truncation reveal — `<td className="truncate" title={fullText}>`. Overflow recovery rather
 *      than help; needs a widened column, wrapping, or a real tooltip. Not yet ratified.
 *
 * Do not add entries. Shrink this list; when it is empty, delete the file and the override block.
 */
export const TITLE_ATTRIBUTE_LEGACY_SURFACES = [
  "src/app/(operator)/administration/ai-usage/_sections/ai-usage/AiUsageDailyUsagePanel.tsx",
  "src/app/(operator)/administration/billing/OperatorBillingWalletPanel.tsx",
  "src/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveRoiEnvironmentSavingsSection.tsx",
  "src/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveRoiTrendSection.tsx",
  "src/app/(operator)/architecture/reviews/_sections/ReviewsHubResumeDrafts.tsx",
  "src/app/(operator)/governance/alert-rules/AlertRulesHubClient.tsx",
  "src/app/(operator)/governance/audit/_sections/AuditTimelineEventCard.tsx",
  "src/app/(operator)/governance/audit/_sections/BuyerAuditEventsTechnicalAppendix.tsx",
  "src/app/(operator)/governance/policy-packs/_sections/PolicyPackGeneratorSection.tsx",
  "src/app/(operator)/governance/policy-packs/_sections/PolicyPacksInspectSection.tsx",
  "src/app/(operator)/governance/policy-packs/_sections/PolicyPacksRegisteredListSection.tsx",
  "src/app/(operator)/governance/policy-packs/_sections/PolicyRuleAuthoringWizard.tsx",
  "src/app/(operator)/insights/evidence-graph/_sections/EvidenceTrailBuyerTraceTable.tsx",
  "src/app/(operator)/insights/evidence-graph/_sections/GraphPageControls.tsx",
  "src/app/(operator)/integrations/slack/_sections/SlackDestinationForm.tsx",
  "src/app/(operator)/internal/trial-funnel/_sections/TrialFunnelOpsPageClient.tsx",
  "src/components/alerts/AlertRoutingContent.tsx",
  "src/components/alerts/AlertRoutingDestinationList.tsx",
  "src/components/alerts/AlertRulesContent.tsx",
  "src/components/alerts/AlertSimulationContent.tsx",
  "src/components/alerts/AlertsInboxPagination.tsx",
  "src/components/alerts/AlertsInboxSummaryRow.tsx",
  "src/components/alerts/AlertTuningContent.tsx",
  "src/components/alerts/CompositeAlertRulesContent.tsx",
  "src/components/architecture/ArchitectureDraftListClient.tsx",
  "src/components/ArtifactIntegrityTechnicalDetails.tsx",
  "src/components/ArtifactListTable.tsx",
  "src/components/BeforeAfterDelta/BeforeAfterDeltaTopPanel.tsx",
  "src/components/BulkEvidenceUpload.tsx",
  "src/components/BuyerCtoDemoTourOverlay.tsx",
  "src/components/ComplianceDriftOpenResolvedChart.tsx",
  "src/components/cto-demo/CtoDemoSimulatorTrustBadge.tsx",
  "src/components/cto-demo/CtoDemoStorySelector.tsx",
  "src/components/digests/DigestSubscriptionCreateForm.tsx",
  "src/components/EmailRunToSponsorBanner.tsx",
  "src/components/EstimatedLlmCostBarChart.tsx",
  "src/components/ExplanationEvidenceBasisBadges.tsx",
  "src/components/findings/FindingExplainabilityDialog.tsx",
  "src/components/FindingPolicyPackBadge.tsx",
  "src/components/FindingPolicyRuleBadge.tsx",
  "src/components/FindingsWhatIfAnalysisPanel.tsx",
  "src/components/FindingTrustChip.tsx",
  "src/components/GovernanceApprovalInspectorPreview.tsx",
  "src/components/InspectorPanel.tsx",
  "src/components/LayerContextStrip.tsx",
  "src/components/LayerHeader.tsx",
  "src/components/marketing/CtaButton.tsx",
  "src/components/provenance/ProvenancePageWorkspace.tsx",
  "src/components/ProvenanceReferenceLink.tsx",
  "src/components/reviews/ReviewAgentExecutionLogSection.tsx",
  "src/components/reviews/ReviewSealedIndicatorChip.tsx",
  "src/components/RoiTelemetryCard.tsx",
  "src/components/RunFindingExplainabilityTable.tsx",
  "src/components/RunRetrievalExemplarStylePriorStrip.tsx",
  "src/components/RunsListProofHeadline.tsx",
  "src/components/RunToolInvocationForensicsRawCell.tsx",
  "src/components/RunTraceViewerLink.tsx",
  "src/components/ScopeSwitcherTenantContextFooter.tsx",
  "src/components/shell/DeploymentBuildFingerprintStrip.tsx",
  "src/components/shell/TenantWorkspaceBoundaryBadge.tsx",
  "src/components/sidebar-nav/SidebarAdministrationSection.tsx",
  "src/components/sidebar-nav/SidebarGovernanceDisclosureSection.tsx",
  "src/components/sidebar-nav/SidebarNavCluster.tsx",
  "src/components/sidebar-nav/SidebarNavLayoutSettingsPanel.tsx",
  "src/components/sidebar-nav/SidebarNavLink.tsx",
  "src/components/SponsorArtifactEvidenceBadge.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/usability/WizardEvidenceUploadZone.tsx",
];

export default TITLE_ATTRIBUTE_LEGACY_SURFACES;
