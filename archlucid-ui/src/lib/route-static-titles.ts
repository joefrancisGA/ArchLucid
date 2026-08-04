import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EXECUTIVE_SUMMARY_PAGE_TITLE } from "@/lib/sponsor-report-navigation";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance-route-paths";
import { CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_LIST_PATH, ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { ALERTS_CONFIGURATION_PAGE_TITLE } from "@/lib/alerts-page-copy";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance-overview-copy";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";
import { CLOUD_CONNECTIONS_PATH, INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { ITSM_CONNECTORS_ADMIN_LABEL, ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm-connectors-admin-scope";
import { PATTERN_LIBRARY_PAGE_TITLE } from "@/lib/pattern-library-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { API_KEYS_PAGE_TITLE } from "@/lib/api-keys-settings-copy";

/** Static pathname → announcement title mappings for documented top-level routes. */
export const ROUTE_TITLES: Record<string, string> = {
  "/": OPERATOR_NAV_LINK_LABELS.home,
  [ARCHITECTURES_LIST_PATH]: "Architectures",
  [ARCHITECTURES_NEW_PATH]: CREATE_ARCHITECTURE_LABEL,
  "/architecture/reviews": RUNS_LIST_PAGE_TITLES.buyerPolished,
  "/architecture/reviews/new": START_REVIEW_LABEL,
  "/alerts": "Alerts",
  "/alert-rules": ALERTS_CONFIGURATION_PAGE_TITLE,
  "/governance/alert-rules": ALERTS_CONFIGURATION_PAGE_TITLE,
  [COMPARE_TWO_REVIEWS_PATH]: OPERATOR_NAV_LINK_LABELS.compareTwoReviews,
  [EVIDENCE_GRAPH_PATH]: OPERATOR_NAV_LINK_LABELS.evidenceTrail,
  "/insights/patterns": PATTERN_LIBRARY_PAGE_TITLE,
  "/architecture-intelligence": "Architecture intelligence",
  [GOVERNANCE_APPROVAL_QUEUE_PATH]: GOVERNANCE_OVERVIEW_PAGE_TITLE,
  "/governance/dashboard": "Executive Workspace Health",
  "/governance/findings": OPERATOR_NAV_LINK_LABELS.findings,
  "/governance/decision-register": "Decision register",
  [SIGNED_RECORDS_LIST_PATH]: "Signed review records",
  "/manifests": "Signed review records",
  "/governance/policy-packs": "Policy packs",
  [GOVERNANCE_STANDARDS_AND_RULES_PATH]: OPERATOR_NAV_LINK_LABELS.governanceResolution,
  "/governance/audit": "Audit",
  "/governance/alerts": "Alerts",
  "/governance/advisory-scans": "Advisory scans",
  "/insights/search-review-evidence": "Search",
  "/insights/ask-review-questions": "Ask",
  "/replay": "Replay",
  "/audit": "Audit",
  "/administration/system-health": "System health",
  "/insights/planning": "Improvement planning",
  "/architecture/first-review-guide": OPERATOR_NAV_LINK_LABELS.onboarding,
  "/administration/settings/billing": "Billing & plans",
  "/administration/settings/tenant": OPERATOR_NAV_LINK_LABELS.settings,
  "/administration/settings/tenant/recycle-bin": "Projects recycle bin",
  [CLOUD_CONNECTIONS_PATH]: OPERATOR_NAV_LINK_LABELS.cloudConnections,
  "/settings/cloud-connections": OPERATOR_NAV_LINK_LABELS.cloudConnections,
  [AI_USAGE_SETTINGS_PATH]: OPERATOR_NAV_LINK_LABELS.aiUsage,
  "/settings/cost-reporting": OPERATOR_NAV_LINK_LABELS.aiUsage,
  "/administration/settings/api-keys": API_KEYS_PAGE_TITLE,
  "/administration/settings/preferences": "Preferences",
  "/integrations/jira": OPERATOR_NAV_LINK_LABELS.jira,
  "/integrations/servicenow": OPERATOR_NAV_LINK_LABELS.servicenow,
  [INTEGRATIONS_READINESS_PATH]: OPERATOR_NAV_LINK_LABELS.integrationReadiness,
  [EXECUTIVE_DASHBOARD_HREF]: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
  "/executive/scorecard": BUYER_EXECUTIVE_SUMMARY_VOCABULARY.scorecardPageTitle,
  "/digests": "Digests",
  "/sponsor-report/executive-summary": EXECUTIVE_SUMMARY_PAGE_TITLE,
  "/sponsor-report/pilot-outcomes": "Pilot outcomes",
  "/sponsor-report/roi-summary": "ROI summary",
  [ARCHITECTURE_SCORECARD_PATH]: OPERATOR_NAV_LINK_LABELS.scorecard,
  "/value-report/roi": "ROI summary",
  "/admin/demo-readiness": "Demo readiness",
  [ITSM_CONNECTORS_ADMIN_PATH]: ITSM_CONNECTORS_ADMIN_LABEL,
};
