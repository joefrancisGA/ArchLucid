import type { ReactElement } from "react";
import dynamic from "next/dynamic";

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { ScopeHelpCurrentScopePanel } from "@/components/help/ScopeHelpCurrentScopePanel";
import { ScopeHelpEvidenceOrientationStrip } from "@/components/help/ScopeHelpEvidenceOrientationStrip";
import { SecurityTrustHelpEvidenceOrientationStrip } from "@/components/help/SecurityTrustHelpEvidenceOrientationStrip";
import { SubprocessorsHelpEvidenceOrientationStrip } from "@/components/help/SubprocessorsHelpEvidenceOrientationStrip";
import { HelpSubprocessorsHeaderMetadata } from "@/app/(operator)/help/_sections/HelpSubprocessorsHeaderMetadata";
import { SECURITY_TRUST_HELP_CLAIM_HEADING_ID } from "@/lib/security-trust-help-evidence-copy";
import { assertHelpTopicCatchAllFallthroughAllowed } from "@/lib/help/help-topic-catch-all-fallthrough";
import type { LoadedHelpTopicContent } from "@/lib/help/help-topic-content-loader";

const HelpIntegrationReadinessGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpIntegrationReadinessGuideView").then(
    (module) => module.HelpIntegrationReadinessGuideView,
  ),
);
const HelpPathChooserGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPathChooserGuideView").then((module) => module.HelpPathChooserGuideView),
);
const HelpAcceleratorChooserGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAcceleratorChooserGuideView").then((module) => module.HelpAcceleratorChooserGuideView),
);
const HelpAlertsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAlertsGuideView").then((module) => module.HelpAlertsGuideView),
);
const HelpDigestsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpDigestsGuideView").then((module) => module.HelpDigestsGuideView),
);
const HelpDecisionRegisterGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpDecisionRegisterGuideView").then((module) => module.HelpDecisionRegisterGuideView),
);
const HelpImprovementPlanningGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpImprovementPlanningGuideView").then((module) => module.HelpImprovementPlanningGuideView),
);
const HelpImpactPreviewGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpImpactPreviewGuideView").then((module) => module.HelpImpactPreviewGuideView),
);
const HelpAdvisoryScansGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAdvisoryScansGuideView").then((module) => module.HelpAdvisoryScansGuideView),
);
const HelpRecurrenceSchedulesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpRecurrenceSchedulesGuideView").then(
    (module) => module.HelpRecurrenceSchedulesGuideView,
  ),
);
const HelpRoiSummaryGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpRoiSummaryGuideView").then((module) => module.HelpRoiSummaryGuideView),
);
const HelpArchitectureScorecardGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpArchitectureScorecardGuideView").then((module) => module.HelpArchitectureScorecardGuideView),
);
const HelpConnectionStatusGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConnectionStatusGuideView").then((module) => module.HelpConnectionStatusGuideView),
);
const HelpReportAProblemGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpReportAProblemGuideView").then((module) => module.HelpReportAProblemGuideView),
);
const HelpPriorManifestRetrievalGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPriorManifestRetrievalGuideView").then(
    (module) => module.HelpPriorManifestRetrievalGuideView,
  ),
);
const HelpStandardsRulesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpStandardsRulesGuideView").then((module) => module.HelpStandardsRulesGuideView),
);
const HelpBaselineSettingsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpBaselineSettingsGuideView").then((module) => module.HelpBaselineSettingsGuideView),
);
const HelpContactSupportGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpContactSupportGuideView").then((module) => module.HelpContactSupportGuideView),
);
const HelpSlackIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSlackIntegrationGuideView").then((module) => module.HelpSlackIntegrationGuideView),
);
const HelpTeamsIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpTeamsIntegrationGuideView").then((module) => module.HelpTeamsIntegrationGuideView),
);
const HelpWebhooksIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpWebhooksIntegrationGuideView").then((module) => module.HelpWebhooksIntegrationGuideView),
);
const HelpApiKeysGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpApiKeysGuideView").then((module) => module.HelpApiKeysGuideView),
);
const HelpSystemHealthGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSystemHealthGuideView").then((module) => module.HelpSystemHealthGuideView),
);
const HelpAiUsageGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAiUsageGuideView").then((module) => module.HelpAiUsageGuideView),
);
const HelpPreferencesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPreferencesGuideView").then((module) => module.HelpPreferencesGuideView),
);
const HelpNotificationsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpNotificationsGuideView").then((module) => module.HelpNotificationsGuideView),
);
const HelpWorkspaceSettingsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpWorkspaceSettingsGuideView").then((module) => module.HelpWorkspaceSettingsGuideView),
);
const HelpEvidenceGraphGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpEvidenceGraphGuideView").then((module) => module.HelpEvidenceGraphGuideView),
);
const HelpSearchReviewEvidenceGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSearchReviewEvidenceGuideView").then((module) => module.HelpSearchReviewEvidenceGuideView),
);
const HelpArchitectureIntelligenceGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpArchitectureIntelligenceGuideView").then((module) => module.HelpArchitectureIntelligenceGuideView),
);
const HelpSponsorDashboardGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSponsorDashboardGuideView").then((module) => module.HelpSponsorDashboardGuideView),
);
const HelpArchitectureDraftsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpArchitectureDraftsGuideView").then((module) => module.HelpArchitectureDraftsGuideView),
);
const HelpModelGovernanceGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpModelGovernanceGuideView").then((module) => module.HelpModelGovernanceGuideView),
);
const HelpJiraIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpJiraIntegrationGuideView").then((module) => module.HelpJiraIntegrationGuideView),
);
const HelpServiceNowIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpServiceNowIntegrationGuideView").then((module) => module.HelpServiceNowIntegrationGuideView),
);
const HelpAdminDiagnosticsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAdminDiagnosticsGuideView").then((module) => module.HelpAdminDiagnosticsGuideView),
);
const HelpAuthenticationSignInGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAuthenticationSignInGuideView").then(
    (module) => module.HelpAuthenticationSignInGuideView,
  ),
);
const HelpApiContractsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpApiContractsGuideView").then((module) => module.HelpApiContractsGuideView),
);
const HelpBillingAndPlansGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpBillingAndPlansGuideView").then((module) => module.HelpBillingAndPlansGuideView),
);
const HelpSponsorSummaryGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSponsorSummaryGuideView").then((module) => module.HelpSponsorSummaryGuideView),
);
const HelpFindingsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpFindingsGuideView").then((module) => module.HelpFindingsGuideView),
);
const HelpGlossaryPageView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpGlossaryPageView").then((module) => module.HelpGlossaryPageView),
);
const HelpUsersAndRolesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpUsersAndRolesGuideView").then((module) => module.HelpUsersAndRolesGuideView),
);
const HelpCliUsageTechnicalReferenceView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpCliUsageTechnicalReferenceView").then(
    (module) => module.HelpCliUsageTechnicalReferenceView,
  ),
);
const HelpGovernanceApprovalGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpGovernanceApprovalGuideView").then((module) => module.HelpGovernanceApprovalGuideView),
);
const HelpAzurePermissionsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAzurePermissionsGuideView").then((module) => module.HelpAzurePermissionsGuideView),
);
const HelpAuditTrailGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAuditTrailGuideView").then((module) => module.HelpAuditTrailGuideView),
);
const HelpReviewPackagesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpReviewPackagesGuideView").then((module) => module.HelpReviewPackagesGuideView),
);
const HelpReviewGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpReviewGuideView").then((module) => module.HelpReviewGuideView),
);
const HelpProcurementGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpProcurementGuideView").then((module) => module.HelpProcurementGuideView),
);
const HelpCaiqSigResponseGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpCaiqSigResponseGuideView").then((module) => module.HelpCaiqSigResponseGuideView),
);
const HelpPilotGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPilotGuideView").then((module) => module.HelpPilotGuideView),
);
const HelpPolicyPackDeltaDemoGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPolicyPackDeltaDemoGuideView").then(
    (module) => module.HelpPolicyPackDeltaDemoGuideView,
  ),
);
const HelpPilotFeedbackGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPilotFeedbackGuideView").then((module) => module.HelpPilotFeedbackGuideView),
);
const HelpConfigurationReferenceGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConfigurationReferenceGuideView").then(
    (module) => module.HelpConfigurationReferenceGuideView,
  ),
);
const HelpDataHandlingTenantIsolationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationGuideView").then(
    (module) => module.HelpDataHandlingTenantIsolationGuideView,
  ),
);
const HelpDpaTemplateGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpDpaTemplateGuideView").then((module) => module.HelpDpaTemplateGuideView),
);
const HelpSoc2SelfAssessmentGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSoc2SelfAssessmentGuideView").then((module) => module.HelpSoc2SelfAssessmentGuideView),
);
const HelpEngineeringTroubleshootingGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingGuideView").then(
    (module) => module.HelpEngineeringTroubleshootingGuideView,
  ),
);
const HelpEnterpriseOnboardingGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpEnterpriseOnboardingGuideView").then(
    (module) => module.HelpEnterpriseOnboardingGuideView,
  ),
);
const HelpEvidenceIntakeGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpEvidenceIntakeGuideView").then((module) => module.HelpEvidenceIntakeGuideView),
);
const HelpEvidenceTrailGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpEvidenceTrailGuideView").then((module) => module.HelpEvidenceTrailGuideView),
);
const HelpPolicyPacksGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPolicyPacksGuideView").then((module) => module.HelpPolicyPacksGuideView),
);
const HelpConnectAzureSecurelyGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConnectAzureSecurelyGuideView").then((module) => module.HelpConnectAzureSecurelyGuideView),
);
const HelpConnectAwsSecurelyGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConnectAwsSecurelyGuideView").then((module) => module.HelpConnectAwsSecurelyGuideView),
);
const HelpConnectGcpSecurelyGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConnectGcpSecurelyGuideView").then((module) => module.HelpConnectGcpSecurelyGuideView),
);
const HelpCorePilotGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpCorePilotGuideView").then((module) => module.HelpCorePilotGuideView),
);
const HelpComparisonReplayGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpComparisonReplayGuideView").then((module) => module.HelpComparisonReplayGuideView),
);
const HelpRepeatReviewLoopGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpRepeatReviewLoopGuideView").then((module) => module.HelpRepeatReviewLoopGuideView),
);
const HelpSpecialtyWalkthroughTemplatesView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesView").then(
    (module) => module.HelpSpecialtyWalkthroughTemplatesView,
  ),
);
const HelpGettingStartedGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpGettingStartedGuideView").then((module) => module.HelpGettingStartedGuideView),
);
const HelpCloudConnectionsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpCloudConnectionsGuideView").then((module) => module.HelpCloudConnectionsGuideView),
);
const HelpAzureBoardsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAzureBoardsGuideView").then((module) => module.HelpAzureBoardsGuideView),
);
const HelpTroubleshootingGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpTroubleshootingGuideView").then((module) => module.HelpTroubleshootingGuideView),
);

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  const value = searchParams?.[key];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
}

function resolveAzurePermissionsReturnHref(returnTo: string | undefined): string {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.startsWith("/integrations/cloud-connections")) {
    return trimmed;
  }

  return "/integrations/cloud-connections";
}

function resolveGcpConnectionHelpReturnHref(returnTo: string | undefined): string {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.startsWith("/integrations/cloud-connections")) {
    return trimmed;
  }

  return "/integrations/cloud-connections/gcp";
}


export function resolveHelpTopicView(
  loaded: LoadedHelpTopicContent,
  searchParams?: Record<string, string | string[] | undefined>,
): ReactElement {
  if (loaded.entry.slug === "first-architecture-review") {
    return <HelpCorePilotGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "getting-started") {
    return <HelpGettingStartedGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "cloud-connections") {
    return <HelpCloudConnectionsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "troubleshooting") {
    return <HelpTroubleshootingGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "alerts") {
    return <HelpAlertsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "digests") {
    return <HelpDigestsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "decision-register") {
    return <HelpDecisionRegisterGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "improvement-planning") {
    return <HelpImprovementPlanningGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "impact-preview") {
    return <HelpImpactPreviewGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "advisory-scans") {
    return <HelpAdvisoryScansGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "recurrence-schedules") {
    return <HelpRecurrenceSchedulesGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "roi-summary") {
    return <HelpRoiSummaryGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "architecture-scorecard") {
    return <HelpArchitectureScorecardGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "connection-status") {
    return <HelpConnectionStatusGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "standards-and-rules") {
    return <HelpStandardsRulesGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "baseline-settings") {
    return <HelpBaselineSettingsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "slack-integration") {
    return <HelpSlackIntegrationGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "teams-integration") {
    return <HelpTeamsIntegrationGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "webhooks-integration") {
    return <HelpWebhooksIntegrationGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "api-keys") {
    return <HelpApiKeysGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "system-health") {
    return <HelpSystemHealthGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "ai-usage") {
    return <HelpAiUsageGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "preferences") {
    return <HelpPreferencesGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "notifications") {
    return <HelpNotificationsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "workspace-settings") {
    return <HelpWorkspaceSettingsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "evidence-graph") {
    return <HelpEvidenceGraphGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "search-review-evidence") {
    return <HelpSearchReviewEvidenceGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "architecture-intelligence") {
    return <HelpArchitectureIntelligenceGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "sponsor-dashboard") {
    return <HelpSponsorDashboardGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "architecture-drafts") {
    return <HelpArchitectureDraftsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "model-governance") {
    return <HelpModelGovernanceGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "jira-integration") {
    return <HelpJiraIntegrationGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "servicenow-integration") {
    return <HelpServiceNowIntegrationGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "billing-and-plans") {
    return <HelpBillingAndPlansGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "sponsor-report") {
    return <HelpSponsorSummaryGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "findings") {
    return <HelpFindingsGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "governance-approval") {
    return <HelpGovernanceApprovalGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "cli-usage") {
    return <HelpCliUsageTechnicalReferenceView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "glossary") {
    return <HelpGlossaryPageView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "users-and-roles") {
    return <HelpUsersAndRolesGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "cloud-connections-azure") {
    return (
      <HelpConnectAzureSecurelyGuideView
        entry={loaded.entry}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }

  if (loaded.entry.slug === "cloud-connections-aws") {
    return (
      <HelpConnectAwsSecurelyGuideView
        entry={loaded.entry}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }

  if (loaded.entry.slug === "cloud-connections-gcp") {
    return (
      <HelpConnectGcpSecurelyGuideView
        entry={loaded.entry}
        returnHref={resolveGcpConnectionHelpReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }

  if (loaded.entry.slug === "azure-permissions") {
    return (
      <HelpAzurePermissionsGuideView
        entry={loaded.entry}
        subscriptionId={readSearchParam(searchParams, "subscriptionId")}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }

  if (loaded.entry.slug === "specialty-walkthroughs") {
    return <HelpSpecialtyWalkthroughTemplatesView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "repeat-review-loop") {
    return <HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "audit-trail") {
    return <HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "review-packages") {
    return <HelpReviewPackagesGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "review-guide") {
    return <HelpReviewGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "pilot-guide") {
    return <HelpPilotGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "data-handling") {
    return <HelpDataHandlingTenantIsolationGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "dpa-template") {
    return <HelpDpaTemplateGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "soc2-self-assessment") {
    return <HelpSoc2SelfAssessmentGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "configuration-reference") {
    return <HelpConfigurationReferenceGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "enterprise-onboarding") {
    return <HelpEnterpriseOnboardingGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "evidence-intake") {
    return <HelpEvidenceIntakeGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "engineering-troubleshooting") {
    return <HelpEngineeringTroubleshootingGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "api-contracts") {
    return <HelpApiContractsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "security-trust") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<SecurityTrustHelpEvidenceOrientationStrip />}
        claimDisciplineTocHeadingId={SECURITY_TRUST_HELP_CLAIM_HEADING_ID}
      />
    );
  }

  if (loaded.entry.slug === "accelerator-chooser") {
    return <HelpAcceleratorChooserGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "admin-diagnostics") {
    return <HelpAdminDiagnosticsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "authentication-sign-in") {
    return <HelpAuthenticationSignInGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "azure-boards") {
    return <HelpAzureBoardsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "policy-packs") {
    return <HelpPolicyPacksGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "policy-pack-delta-demo") {
    return <HelpPolicyPackDeltaDemoGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "prior-manifest-retrieval") {
    return <HelpPriorManifestRetrievalGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "report-a-problem") {
    return <HelpReportAProblemGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "contact-support") {
    return <HelpContactSupportGuideView entry={loaded.entry} />;
  }

  if (loaded.entry.slug === "subprocessors") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        titleBlockOrientation={<HelpSubprocessorsHeaderMetadata entry={loaded.entry} />}
        evidenceOrientation={<SubprocessorsHelpEvidenceOrientationStrip />}
      />
    );
  }

  if (loaded.entry.slug === "integration-readiness") {
    return <HelpIntegrationReadinessGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "pilot-feedback") {
    return <HelpPilotFeedbackGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "caiq-sig-response") {
    return <HelpCaiqSigResponseGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "choose-your-next-step") {
    return <HelpPathChooserGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "comparison-replay") {
    return <HelpComparisonReplayGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "scope") {
    return (
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={
          <>
            <ScopeHelpEvidenceOrientationStrip />
            <ScopeHelpCurrentScopePanel />
          </>
        }
      />
    );
  }

  if (loaded.entry.slug === "procurement") {
    return <HelpProcurementGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  if (loaded.entry.slug === "evidence-trail") {
    return <HelpEvidenceTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  assertHelpTopicCatchAllFallthroughAllowed(loaded.entry);

  return (
    <HelpTopicMarkdownView
      entry={loaded.entry}
      markdown={loaded.markdown}
      showContextualHelp
    />
  );
}

