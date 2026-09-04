import type { ReactElement } from "react";
import dynamic from "next/dynamic";

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import type { LoadedHelpTopicContent } from "@/lib/help/help-topic-content-loader";


const HelpAcceleratorChooserGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAcceleratorChooserGuideView").then((module) => module.HelpAcceleratorChooserGuideView),
);
const HelpAdvisoryScansGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAdvisoryScansGuideView").then((module) => module.HelpAdvisoryScansGuideView),
);
const HelpAlertsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAlertsGuideView").then((module) => module.HelpAlertsGuideView),
);
const HelpArchitectureDraftsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpArchitectureDraftsGuideView").then((module) => module.HelpArchitectureDraftsGuideView),
);
const HelpArchitectureIntelligenceGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpArchitectureIntelligenceGuideView").then((module) => module.HelpArchitectureIntelligenceGuideView),
);
const HelpArchitectureScorecardGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpArchitectureScorecardGuideView").then((module) => module.HelpArchitectureScorecardGuideView),
);
const HelpAuditTrailGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAuditTrailGuideView").then((module) => module.HelpAuditTrailGuideView),
);
const HelpBaselineSettingsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpBaselineSettingsGuideView").then((module) => module.HelpBaselineSettingsGuideView),
);
const HelpCaiqSigResponseGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpCaiqSigResponseGuideView").then((module) => module.HelpCaiqSigResponseGuideView),
);
const HelpCliUsageTechnicalReferenceView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpCliUsageTechnicalReferenceView").then(
    (module) => module.HelpCliUsageTechnicalReferenceView,
  ),
);
const HelpComparisonReplayGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpComparisonReplayGuideView").then((module) => module.HelpComparisonReplayGuideView),
);
const HelpConfigurationReferenceGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConfigurationReferenceGuideView").then(
    (module) => module.HelpConfigurationReferenceGuideView,
  ),
);
const HelpConnectionStatusGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConnectionStatusGuideView").then((module) => module.HelpConnectionStatusGuideView),
);
const HelpCorePilotGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpCorePilotGuideView").then((module) => module.HelpCorePilotGuideView),
);
const HelpDataHandlingTenantIsolationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationGuideView").then(
    (module) => module.HelpDataHandlingTenantIsolationGuideView,
  ),
);
const HelpDecisionRegisterGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpDecisionRegisterGuideView").then((module) => module.HelpDecisionRegisterGuideView),
);
const HelpDigestsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpDigestsGuideView").then((module) => module.HelpDigestsGuideView),
);
const HelpDpaTemplateGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpDpaTemplateGuideView").then((module) => module.HelpDpaTemplateGuideView),
);
const HelpSecurityTrustGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSecurityTrustGuideView").then(
    (module) => module.HelpSecurityTrustGuideView,
  ),
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
const HelpEvidenceGraphGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpEvidenceGraphGuideView").then((module) => module.HelpEvidenceGraphGuideView),
);
const HelpEvidenceIntakeGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpEvidenceIntakeGuideView").then((module) => module.HelpEvidenceIntakeGuideView),
);
const HelpEvidenceTrailGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpEvidenceTrailGuideView").then((module) => module.HelpEvidenceTrailGuideView),
);
const HelpFindingsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpFindingsGuideView").then((module) => module.HelpFindingsGuideView),
);
const HelpGettingStartedGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpGettingStartedGuideView").then((module) => module.HelpGettingStartedGuideView),
);
const HelpGlossaryPageView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpGlossaryPageView").then((module) => module.HelpGlossaryPageView),
);
const HelpGovernanceApprovalGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpGovernanceApprovalGuideView").then((module) => module.HelpGovernanceApprovalGuideView),
);
const HelpImpactPreviewGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpImpactPreviewGuideView").then((module) => module.HelpImpactPreviewGuideView),
);
const HelpImprovementPlanningGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpImprovementPlanningGuideView").then((module) => module.HelpImprovementPlanningGuideView),
);
const HelpModelGovernanceGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpModelGovernanceGuideView").then((module) => module.HelpModelGovernanceGuideView),
);
const HelpPathChooserGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPathChooserGuideView").then((module) => module.HelpPathChooserGuideView),
);
const HelpPilotFeedbackGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPilotFeedbackGuideView").then((module) => module.HelpPilotFeedbackGuideView),
);
const HelpPilotGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPilotGuideView").then((module) => module.HelpPilotGuideView),
);
const HelpPolicyPackDeltaDemoGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPolicyPackDeltaDemoGuideView").then(
    (module) => module.HelpPolicyPackDeltaDemoGuideView,
  ),
);
const HelpPolicyPacksGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPolicyPacksGuideView").then((module) => module.HelpPolicyPacksGuideView),
);
const HelpPriorManifestRetrievalGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPriorManifestRetrievalGuideView").then(
    (module) => module.HelpPriorManifestRetrievalGuideView,
  ),
);
const HelpProcurementGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpProcurementGuideView").then((module) => module.HelpProcurementGuideView),
);
const HelpRecurrenceSchedulesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpRecurrenceSchedulesGuideView").then(
    (module) => module.HelpRecurrenceSchedulesGuideView,
  ),
);
const HelpRepeatReviewLoopGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpRepeatReviewLoopGuideView").then((module) => module.HelpRepeatReviewLoopGuideView),
);
const HelpReviewGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpReviewGuideView").then((module) => module.HelpReviewGuideView),
);
const HelpReviewPackagesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpReviewPackagesGuideView").then((module) => module.HelpReviewPackagesGuideView),
);
const HelpRoiSummaryGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpRoiSummaryGuideView").then((module) => module.HelpRoiSummaryGuideView),
);
const HelpSearchReviewEvidenceGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSearchReviewEvidenceGuideView").then((module) => module.HelpSearchReviewEvidenceGuideView),
);
const HelpScopeGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpScopeGuideView").then((module) => module.HelpScopeGuideView),
);
const HelpSoc2SelfAssessmentGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSoc2SelfAssessmentGuideView").then((module) => module.HelpSoc2SelfAssessmentGuideView),
);
const HelpSubprocessorsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSubprocessorsGuideView").then((module) => module.HelpSubprocessorsGuideView),
);
const HelpSpecialtyWalkthroughTemplatesView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesView").then(
    (module) => module.HelpSpecialtyWalkthroughTemplatesView,
  ),
);
const HelpSponsorDashboardGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSponsorDashboardGuideView").then((module) => module.HelpSponsorDashboardGuideView),
);
const HelpSponsorSummaryGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSponsorSummaryGuideView").then((module) => module.HelpSponsorSummaryGuideView),
);
const HelpStandardsRulesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpStandardsRulesGuideView").then((module) => module.HelpStandardsRulesGuideView),
);
const HelpStructuredBriefGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpStructuredBriefGuideView").then((module) => module.HelpStructuredBriefGuideView),
);
const HelpTroubleshootingGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpTroubleshootingGuideView").then((module) => module.HelpTroubleshootingGuideView),
);

export function tryResolveOperateHelpTopicView(
  loaded: LoadedHelpTopicContent,
): ReactElement | null {
  if (loaded.entry.slug === "first-architecture-review") {
    return <HelpCorePilotGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "getting-started") {
    return <HelpGettingStartedGuideView entry={loaded.entry} />;
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
  if (loaded.entry.slug === "structured-brief") {
    return <HelpStructuredBriefGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "model-governance") {
    return <HelpModelGovernanceGuideView entry={loaded.entry} />;
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
  if (loaded.entry.slug === "security-trust") {
    return <HelpSecurityTrustGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }
  if (loaded.entry.slug === "accelerator-chooser") {
    return <HelpAcceleratorChooserGuideView entry={loaded.entry} />;
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
  if (loaded.entry.slug === "subprocessors") {
    return <HelpSubprocessorsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
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
    return <HelpScopeGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }
  if (loaded.entry.slug === "procurement") {
    return <HelpProcurementGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }
  if (loaded.entry.slug === "evidence-trail") {
    return <HelpEvidenceTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  // Unhandled slugs must fall through to the integrations/admin resolvers; only
  // resolveHelpTopicView owns the terminal TB-1601 bare-markdown assert.
  return null;
}
