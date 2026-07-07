import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance-overview-copy";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";
import { CLOUD_CONNECTIONS_PATH, INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";

/** Static pathname → announcement title mappings for documented top-level routes. */
export const ROUTE_TITLES: Record<string, string> = {
  "/": OPERATOR_NAV_LINK_LABELS.home,
  "/reviews": RUNS_LIST_PAGE_TITLES.buyerPolished,
  "/reviews/new": CREATE_ARCHITECTURE_LABEL,
  "/alerts": "Alerts",
  "/alert-rules": "Alert rules",
  "/compare": "Compare",
  "/graph": "Graph",
  "/governance": GOVERNANCE_OVERVIEW_PAGE_TITLE,
  "/governance/dashboard": "Executive Workspace Health",
  "/governance/findings": "Architecture risk register",
  "/governance/decision-register": "Decision register",
  "/governance/policy-packs": "Policy packs",
  "/governance/resolution": OPERATOR_NAV_LINK_LABELS.governanceResolution,
  "/governance/audit": "Audit",
  "/governance/alerts": "Alerts",
  "/advisory": "Advisory",
  "/search": "Search",
  "/ask": "Ask",
  "/replay": "Replay",
  "/audit": "Audit",
  "/health": "System health",
  "/planning": "Planning",
  "/onboarding": OPERATOR_NAV_LINK_LABELS.onboarding,
  "/settings/billing": "Billing & plans",
  "/settings/tenant": OPERATOR_NAV_LINK_LABELS.workspaceSettings,
  "/settings/tenant/recycle-bin": "Projects recycle bin",
  [CLOUD_CONNECTIONS_PATH]: OPERATOR_NAV_LINK_LABELS.cloudConnections,
  "/settings/cloud-connections": OPERATOR_NAV_LINK_LABELS.cloudConnections,
  [AI_USAGE_SETTINGS_PATH]: OPERATOR_NAV_LINK_LABELS.aiUsage,
  "/settings/cost-reporting": OPERATOR_NAV_LINK_LABELS.aiUsage,
  "/integrations/jira": OPERATOR_NAV_LINK_LABELS.jira,
  "/integrations/servicenow": OPERATOR_NAV_LINK_LABELS.servicenow,
  [INTEGRATIONS_READINESS_PATH]: OPERATOR_NAV_LINK_LABELS.integrationReadiness,
  "/integrations/operations": OPERATOR_NAV_LINK_LABELS.integrationReadiness,
  "/dashboard": BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
  "/digests": "Digests",
  "/value-report/roi": "ROI summary",
  "/executive/reviews": "Executive reviews",
};
