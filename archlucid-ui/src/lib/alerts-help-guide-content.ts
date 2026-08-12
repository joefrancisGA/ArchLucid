import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import {
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
  ALERTS_CONFIGURE_RULES_LINK_LABEL,
} from "@/lib/alerts-page-copy";
import {
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_RESOLUTION_PATH,
  GOVERNANCE_ALERTS_PATH,
  governanceAlertRulesTabHref,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ALERTS_HELP_PAGE_TITLE = "Understanding governance alerts";

export const ALERTS_HELP_PAGE_SUBTITLE =
  "Learn how ArchLucid identifies governance risks, routes them to the right owners, and tracks resolution.";

export const ALERTS_HELP_OVERVIEW =
  "Governance alerts are created when enabled rules detect findings that require attention. An alert is a follow-up work item driven by alert rules — it is not the same as finding severity. Alerts appear in the Alerts inbox, where authorized users can acknowledge, assign, waive, or resolve them.";

export const ALERTS_HELP_PRIMARY_ACTIONS = {
  openInbox: {
    label: "Open alerts inbox",
    href: GOVERNANCE_ALERTS_PATH,
  },
  configureRules: {
    label: ALERTS_CONFIGURE_RULES_LINK_LABEL,
    href: governanceAlertRulesTabHref("rules"),
  },
  governanceSetup: {
    label: "Review governance setup",
    href: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
  },
} as const;

export type AlertsHelpActionPanelState =
  | "loading"
  | "unavailable"
  | "rules-not-configured"
  | "ready-for-inbox";

export function resolveAlertsHelpActionPanelState(
  readiness: Pick<
    {
      readonly loading: boolean;
      readonly loadFailed: boolean;
      readonly loadForbidden: boolean;
      readonly enabledRulesCount: number;
    },
    "loading" | "loadFailed" | "loadForbidden" | "enabledRulesCount"
  >,
): AlertsHelpActionPanelState {
  if (readiness.loading) {
    return "loading";
  }

  if (readiness.loadFailed || readiness.loadForbidden) {
    return "unavailable";
  }

  if (readiness.enabledRulesCount === 0) {
    return "rules-not-configured";
  }

  return "ready-for-inbox";
}

export const ALERTS_HELP_ACTION_PANEL_TITLES: Readonly<Record<AlertsHelpActionPanelState, string>> = {
  loading: "Checking workspace alert readiness",
  unavailable: "Workspace alert status unavailable",
  "rules-not-configured": "Configure alert rules first",
  "ready-for-inbox": "Open your alerts inbox",
};

export const ALERTS_HELP_ACTION_PANEL_CONSEQUENCES: Readonly<Record<AlertsHelpActionPanelState, string>> = {
  loading: "Loading enabled rules and routing for this workspace.",
  unavailable:
    "Retry from the readiness strip below, or open the alerts inbox or alert rules directly.",
  "rules-not-configured":
    "Without enabled rules, governance risks will not surface as alerts in this workspace.",
  "ready-for-inbox":
    "Review, assign, and resolve alerts routed from your enabled rules.",
};

export const ALERTS_HELP_READINESS_SECTION_TITLE = "Workspace alert readiness";

export const ALERTS_HELP_READINESS_LABELS = {
  enabledRules: "Enabled rules",
  openAlerts: "Open alerts",
  routingDestinations: "Routing destinations",
  mostRecentAlertActivity: "Most recent alert activity",
} as const;

export const ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_HELPER =
  "Based on the latest alert create or update time in this workspace — not a rule evaluation timestamp.";

export const ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NO_RULES = "Rules not configured";

export const ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_NONE = "No alert activity yet";

export const ALERTS_HELP_READINESS_FORBIDDEN_MESSAGE =
  "Live alert status needs a role that can manage governance alerts.";

export const ALERTS_HELP_HOW_ALERTS_WORK_STEPS = [
  "A review identifies architecture findings.",
  "Enabled alert rules evaluate those findings.",
  "Matching conditions create or update an alert.",
  "The alert is routed to the appropriate owner.",
] as const;

export const ALERTS_HELP_TRIGGER_INTRO =
  "Alerts can fire when rule conditions match patterns such as:";

export const ALERTS_HELP_TRIGGER_ITEMS = [
  "Configured thresholds on finding severity or status",
  "Compliance gaps against expected controls",
  "Policy violations from active governance packs",
  "Drift or repeated findings across reviews",
  "Rules that combine multiple conditions",
] as const;

export const ALERTS_HELP_DESTINATION_CARDS = [
  {
    id: "alerts-inbox",
    title: "Alerts inbox",
    description:
      "Review, acknowledge, assign, waive, and resolve active alerts routed from your enabled rules.",
  },
  {
    id: "alert-rules",
    title: "Alert rules",
    description:
      "Create thresholds, routing, combined conditions, and simulations that raise governance alerts.",
  },
] as const;

export const ALERTS_HELP_RESOLUTION_STEPS = [
  "Filter or open an alert.",
  "Review the linked finding and evidence.",
  "Assign an owner or record the appropriate action.",
  "Acknowledge, waive, or resolve the alert.",
  "Refresh or reevaluate when necessary.",
] as const;

export const ALERTS_HELP_RELATED_CONCEPTS = [
  {
    title: "Policy packs",
    description: "Define the governance expectations applied during reviews.",
    href: GOVERNANCE_POLICY_PACKS_PATH,
    linkLabel: "Open policy packs",
  },
  {
    title: "Standards and rules",
    description: "Show which requirements were evaluated for a review.",
    href: GOVERNANCE_RESOLUTION_PATH,
    linkLabel: "Open standards and rules",
  },
  {
    title: "Audit trail",
    description: "Trace who acknowledged, assigned, and resolved governance actions across this workspace.",
    href: inAppHelpHref("audit-trail"),
    linkLabel: "Open audit trail help",
  },
] as const;

export const ALERTS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "how-alerts-work", title: "How alerts work" },
  { level: 2, id: "what-can-trigger-an-alert", title: "What can trigger an alert" },
  { level: 2, id: "where-alerts-are-managed", title: "Where alerts are managed" },
  { level: 2, id: "resolving-an-alert", title: "Resolving an alert" },
  { level: 2, id: "related-governance-concepts", title: "Related governance concepts" },
];
