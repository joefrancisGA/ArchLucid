import { CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_LIST_PATH, ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { ALERTS_CONFIGURATION_PAGE_TITLE } from "@/lib/alerts-page-copy";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance-overview-copy";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";
import { CLOUD_CONNECTIONS_PATH, INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { PATTERN_LIBRARY_PAGE_TITLE } from "@/lib/pattern-library-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { API_KEYS_PAGE_TITLE } from "@/lib/api-keys-settings-copy";

/** Static pathname → announcement title mappings for documented top-level routes. */
export const ROUTE_TITLES: Record<string, string> = {
  "/": OPERATOR_NAV_LINK_LABELS.home,
  [ARCHITECTURES_LIST_PATH]: "Architectures",
  [ARCHITECTURES_NEW_PATH]: CREATE_ARCHITECTURE_LABEL,
  "/reviews": RUNS_LIST_PAGE_TITLES.buyerPolished,
  "/reviews/new": START_REVIEW_LABEL,
  "/alerts": "Alerts",
  "/alert-rules": ALERTS_CONFIGURATION_PAGE_TITLE,
  "/governance/alert-rules": ALERTS_CONFIGURATION_PAGE_TITLE,
  "/compare": "Compare",
  "/graph": OPERATOR_NAV_LINK_LABELS.evidenceTrail,
  "/patterns": PATTERN_LIBRARY_PAGE_TITLE,
  "/governance": GOVERNANCE_OVERVIEW_PAGE_TITLE,
  "/governance/dashboard": "Executive Workspace Health",
  "/governance/findings": OPERATOR_NAV_LINK_LABELS.findings,
  "/governance/decision-register": "Decision register",
  [SIGNED_RECORDS_LIST_PATH]: "Signed review records",
  "/manifests": "Signed review records",
  "/governance/policy-packs": "Policy packs",
  "/governance/resolution": OPERATOR_NAV_LINK_LABELS.governanceResolution,
  "/governance/audit": "Audit",
  "/governance/alerts": "Alerts",
  "/governance/advisory-scans": "Advisory scans",
  "/search": "Search",
  "/ask": "Ask",
  "/replay": "Replay",
  "/audit": "Audit",
  "/health": "System health",
  "/planning": "Improvement planning",
  "/onboarding": OPERATOR_NAV_LINK_LABELS.onboarding,
  "/settings/billing": "Billing & plans",
  "/settings/tenant": OPERATOR_NAV_LINK_LABELS.settings,
  "/settings/tenant/recycle-bin": "Projects recycle bin",
  [CLOUD_CONNECTIONS_PATH]: OPERATOR_NAV_LINK_LABELS.cloudConnections,
  "/settings/cloud-connections": OPERATOR_NAV_LINK_LABELS.cloudConnections,
  [AI_USAGE_SETTINGS_PATH]: OPERATOR_NAV_LINK_LABELS.aiUsage,
  "/settings/cost-reporting": OPERATOR_NAV_LINK_LABELS.aiUsage,
  "/settings/api-keys": API_KEYS_PAGE_TITLE,
  "/settings/preferences": "Preferences",
  "/integrations/jira": OPERATOR_NAV_LINK_LABELS.jira,
  "/integrations/servicenow": OPERATOR_NAV_LINK_LABELS.servicenow,
  [INTEGRATIONS_READINESS_PATH]: OPERATOR_NAV_LINK_LABELS.integrationReadiness,
  "/integrations/operations": OPERATOR_NAV_LINK_LABELS.integrationReadiness,
  "/dashboard": BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
  "/executive/scorecard": BUYER_EXECUTIVE_SUMMARY_VOCABULARY.scorecardPageTitle,
  "/digests": "Digests",
  "/sponsor-report/executive-summary": "Executive summary",
  "/sponsor-report/pilot-outcomes": "Pilot outcomes",
  "/sponsor-report/roi-summary": "ROI summary",
  "/sponsor-report/architecture-scorecard": "Architecture scorecard",
  "/value-report/roi": "ROI summary",
  "/admin/demo-readiness": "Demo readiness",
};
