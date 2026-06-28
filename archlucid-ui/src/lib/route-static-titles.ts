import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";

/** Static pathname → announcement title mappings for documented top-level routes. */
export const ROUTE_TITLES: Record<string, string> = {
  "/": OPERATOR_NAV_LINK_LABELS.home,
  "/reviews": RUNS_LIST_PAGE_TITLES.buyerPolished,
  "/reviews/new": "New review",
  "/alerts": "Alerts",
  "/alert-rules": "Alert rules",
  "/compare": "Compare",
  "/graph": "Graph",
  "/governance": "Governance",
  "/governance/dashboard": "Executive Workspace Health",
  "/governance/findings": "Architecture risk register",
  "/governance/decision-register": "Decision register",
  "/advisory": "Advisory",
  "/search": "Search",
  "/ask": "Ask",
  "/replay": "Replay",
  "/audit": "Audit",
  "/health": "System health",
  "/planning": "Planning",
  "/onboarding": "Onboarding",
  "/settings/billing": "Billing & plans",
  "/settings/tenant": OPERATOR_NAV_LINK_LABELS.workspaceSettings,
  "/settings/tenant/recycle-bin": "Projects recycle bin",
  "/dashboard": BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
  "/digests": "Digests",
  "/value-report/roi": "ROI summary",
  "/executive/reviews": "Executive reviews",
};
