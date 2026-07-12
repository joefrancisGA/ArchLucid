import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import {
  ALERTS_ACTION_CONFIGURE_ALERT_RULES,
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
} from "@/lib/alerts-page-copy";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_RESOLUTION_PATH,
  governanceAlertRulesTabHref,
} from "@/lib/governance-route-paths";

export const ALERTS_HELP_PAGE_TITLE = "Understanding governance alerts";

export const ALERTS_HELP_PAGE_SUBTITLE =
  "Learn how ArchLucid identifies governance risks, routes them to the right owners, and tracks resolution.";

export const ALERTS_HELP_OVERVIEW =
  "Governance alerts are created when enabled rules detect findings that require attention. Alerts appear in the Alerts inbox, where authorized users can acknowledge, assign, waive, or resolve them.";

export const ALERTS_HELP_PRIMARY_ACTIONS = {
  openInbox: {
    label: "Open alerts inbox",
    href: GOVERNANCE_ALERTS_PATH,
  },
  configureRules: {
    label: ALERTS_ACTION_CONFIGURE_ALERT_RULES,
    href: governanceAlertRulesTabHref("rules"),
  },
  governanceSetup: {
    label: "Review governance setup",
    href: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
  },
} as const;

export const ALERTS_HELP_READINESS_LABELS = {
  enabledRules: "Enabled rules",
  openAlerts: "Open alerts",
  routingDestinations: "Routing destinations",
  lastEvaluation: "Last evaluation",
} as const;

export const ALERTS_HELP_HOW_ALERTS_WORK_STEPS = [
  "A review identifies architecture findings.",
  "Enabled alert rules evaluate those findings.",
  "Matching conditions create or update an alert.",
  "The alert is routed to the appropriate owner.",
] as const;

export const ALERTS_HELP_TRIGGER_INTRO =
  "Alerts can fire when rule conditions match patterns such as:";

export const ALERTS_HELP_TRIGGER_ITEMS = [
  "Severity thresholds on open findings",
  "Compliance gaps against expected controls",
  "Policy violations from active governance packs",
  "Drift or repeated findings across reviews",
  "Rules that combine multiple conditions",
] as const;

export const ALERTS_HELP_DESTINATION_CARDS = [
  {
    id: "alerts-inbox",
    title: "Alerts inbox",
    description: "Review, acknowledge, assign, waive, and resolve active alerts.",
    actionLabel: "Open alerts inbox",
    href: GOVERNANCE_ALERTS_PATH,
  },
  {
    id: "alert-rules",
    title: "Alert rules",
    description: "Create thresholds, routing, combined conditions, and simulations.",
    actionLabel: ALERTS_ACTION_CONFIGURE_ALERT_RULES,
    href: governanceAlertRulesTabHref("rules"),
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
    title: "Alerts",
    description: "Surface findings that need attention or follow-up.",
    href: GOVERNANCE_ALERTS_PATH,
    linkLabel: "Open alerts inbox",
  },
] as const;

export const ALERTS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "how-alerts-work", title: "How alerts work" },
  { level: 2, id: "what-can-trigger-an-alert", title: "What can trigger an alert" },
  { level: 2, id: "where-alerts-are-managed", title: "Where alerts are managed" },
  { level: 2, id: "resolving-an-alert", title: "Resolving an alert" },
  { level: 2, id: "related-governance-concepts", title: "Related governance concepts" },
];
