import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import {
  EXECUTIVE_SUMMARY_PAGE_TITLE,
  PILOT_OUTCOMES_PAGE_TITLE,
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_EXCEPTIONS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { ARCHITECTURES_LIST_PATH, ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { EXECUTIVE_DASHBOARD_HREF, EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/executive/executive-dashboard-route";
import {
  INTERNAL_DEMO_READINESS_PAGE_TITLE,
} from "@/lib/demo-readiness-evidence-copy";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { PLANNING_PATH } from "@/lib/planning-route";
import { AUDIT_TRAIL_PAGE_TITLE } from "@/lib/audit-trail-page-copy";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-overview-copy";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { CLOUD_CONNECTIONS_PATH, INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { ITSM_CONNECTORS_ADMIN_LABEL, ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm/itsm-connectors-admin-scope";
import { PATTERN_LIBRARY_PAGE_TITLE } from "@/lib/pattern-library-copy";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { API_KEYS_PAGE_TITLE } from "@/lib/api-keys-settings-copy";
import { ALERTS_CONFIGURATION_PAGE_TITLE } from "@/lib/alerts-page-copy";

/**
 * Static pathname → announcement title mappings for canonical operator routes only.
 * Legacy bookmark paths resolve via next.config redirects — do not register them here.
 */
export const ROUTE_TITLES: Record<string, string> = {
  "/": OPERATOR_NAV_LINK_LABELS.home,
  [ARCHITECTURES_LIST_PATH]: OPERATOR_NAV_LINK_LABELS.architectures,
  [ARCHITECTURES_NEW_PATH]: CREATE_ARCHITECTURE_LABEL,
  "/architecture/reviews": RUNS_LIST_PAGE_TITLES.buyerPolished,
  "/architecture/reviews/new": START_REVIEW_LABEL,
  [COMPARE_TWO_REVIEWS_PATH]: OPERATOR_NAV_LINK_LABELS.compareTwoReviews,
  [EVIDENCE_GRAPH_PATH]: OPERATOR_NAV_LINK_LABELS.evidenceGraph,
  [ASK_REVIEW_QUESTIONS_PATH]: OPERATOR_NAV_LINK_LABELS.askReview,
  [SEARCH_REVIEW_EVIDENCE_PATH]: OPERATOR_NAV_LINK_LABELS.searchEvidence,
  [IMPACT_PREVIEW_PATH]: OPERATOR_NAV_LINK_LABELS.evolutionCandidates,
  "/insights/patterns": PATTERN_LIBRARY_PAGE_TITLE,
  "/architecture/architecture-intelligence": "Architecture intelligence",
  [GOVERNANCE_APPROVAL_QUEUE_PATH]: GOVERNANCE_OVERVIEW_PAGE_TITLE,
  [EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF]: OPERATOR_NAV_LINK_LABELS.workspaceHealth,
  "/governance/findings": OPERATOR_NAV_LINK_LABELS.findings,
  "/governance/findings/assigned-to-me": OPERATOR_NAV_LINK_LABELS.assignedToMeFindings,
  [GOVERNANCE_EXCEPTIONS_PATH]: OPERATOR_NAV_LINK_LABELS.riskExceptions,
  "/governance/decision-register": OPERATOR_NAV_LINK_LABELS.decisionRegister,
  [SIGNED_RECORDS_LIST_PATH]: OPERATOR_NAV_LINK_LABELS.signedReviewRecords,
  "/governance/policy-packs": OPERATOR_NAV_LINK_LABELS.policyPacks,
  [GOVERNANCE_STANDARDS_AND_RULES_PATH]: OPERATOR_NAV_LINK_LABELS.governanceResolution,
  "/governance/audit": AUDIT_TRAIL_PAGE_TITLE,
  "/governance/alerts": OPERATOR_NAV_LINK_LABELS.alerts,
  "/governance/alert-rules": ALERTS_CONFIGURATION_PAGE_TITLE,
  "/governance/advisory-scans": OPERATOR_NAV_LINK_LABELS.architectureAdvisory,
  "/governance/recurrence-schedules": OPERATOR_NAV_LINK_LABELS.recurrenceSchedules,
  "/governance/setup": OPERATOR_NAV_LINK_LABELS.governanceSetupGuide,
  "/internal/replay": OPERATOR_NAV_LINK_LABELS.replayReview,
  "/administration/system-health": OPERATOR_NAV_LINK_LABELS.systemHealth,
  [PLANNING_PATH]: OPERATOR_NAV_LINK_LABELS.planning,
  "/architecture/first-review-guide": OPERATOR_NAV_LINK_LABELS.onboarding,
  "/administration/billing": "Billing & plans",
  "/administration/workspace-settings": OPERATOR_NAV_LINK_LABELS.workspaceSettings,
  "/administration/workspace-settings/recycle-bin": "Projects recycle bin",
  [CLOUD_CONNECTIONS_PATH]: OPERATOR_NAV_LINK_LABELS.cloudConnections,
  [AI_USAGE_SETTINGS_PATH]: OPERATOR_NAV_LINK_LABELS.aiUsage,
  "/administration/api-keys": API_KEYS_PAGE_TITLE,
  "/administration/preferences": "Preferences",
  "/administration/notifications": OPERATOR_NAV_LINK_LABELS.notifications,
  "/integrations/jira": OPERATOR_NAV_LINK_LABELS.jira,
  "/integrations/servicenow": OPERATOR_NAV_LINK_LABELS.servicenow,
  [INTEGRATIONS_READINESS_PATH]: OPERATOR_NAV_LINK_LABELS.integrationReadiness,
  [EXECUTIVE_DASHBOARD_HREF]: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
  [DIGESTS_HUB_PATH]: OPERATOR_NAV_LINK_LABELS.digests,
  "/insights/executive-summary": EXECUTIVE_SUMMARY_PAGE_TITLE,
  [SPONSOR_REPORT_PILOT_OUTCOMES_PATH]: PILOT_OUTCOMES_PAGE_TITLE,
  [SPONSOR_REPORT_ROI_SUMMARY_PATH]: OPERATOR_NAV_LINK_LABELS.roiReport,
  [ARCHITECTURE_SCORECARD_PATH]: OPERATOR_NAV_LINK_LABELS.scorecard,
  "/internal/demo-readiness": INTERNAL_DEMO_READINESS_PAGE_TITLE,
  [ITSM_CONNECTORS_ADMIN_PATH]: ITSM_CONNECTORS_ADMIN_LABEL,
  "/administration": OPERATOR_NAV_LINK_LABELS.settings,
  "/administration/users": OPERATOR_NAV_LINK_LABELS.usersAndRoles,
  "/administration/identity-providers": "Identity providers",
  "/administration/identity/sso-wizard": "SSO wizard",
  "/administration/scim-provisioning": "SCIM provisioning",
  "/administration/security-trust": OPERATOR_NAV_LINK_LABELS.securityTrust,
  "/administration/support": "Support",
  "/integrations/azure-boards": OPERATOR_NAV_LINK_LABELS.azureBoards,
  "/integrations/teams": OPERATOR_NAV_LINK_LABELS.microsoftTeams,
  "/integrations/slack": OPERATOR_NAV_LINK_LABELS.slack,
  "/integrations/webhooks": OPERATOR_NAV_LINK_LABELS.webhooks,
  "/internal/pricing-quote-aging": "Pricing quote follow-up",
  "/internal/trial-funnel": "Trial funnel",
  "/internal/fleet-llm-cogs": "Fleet LLM COGS",
  "/internal/tenant-health": "Tenant health",
  "/internal/tenants": "Tenants",
  "/internal/health": "Diagnostics dashboard",
  "/internal/deployment-status": "Deployment status",
  "/internal/rag-health": OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth,
  "/internal/configuration": "Configuration",
  "/internal/integration-events/dlq": OPERATOR_NAV_LINK_LABELS.failedIntegrationMessages,
  "/internal/evidence-proposals": "Evidence proposals",
  "/internal/platform-bundled-policy-packs": "Platform policy packs",
  "/internal/recommendation-learning": OPERATOR_NAV_LINK_LABELS.recommendationTuning,
  "/internal/product-learning": OPERATOR_NAV_LINK_LABELS.pilotFeedback,
};
