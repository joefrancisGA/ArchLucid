import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  AI_USAGE_HELP_TOPIC_LABEL,
  AI_USAGE_SETTINGS_CANONICAL_PATH,
} from "@/lib/ai-usage-settings-evidence-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const AI_USAGE_HELP_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.aiUsage;

export const AI_USAGE_HELP_PAGE_SUBTITLE =
  "Monitor estimated AI spend, remaining budget, and the workflows driving cost for this workspace.";

export const AI_USAGE_HELP_OVERVIEW =
  "AI usage and cost shows estimated spend and budget signals for the workspace. Treat it as directional operations telemetry — not invoice-accurate financial reporting or a signed-review diligence Sources package.";

export const AI_USAGE_HELP_PRIMARY_ACTION = {
  label: "Open AI usage",
  href: AI_USAGE_SETTINGS_CANONICAL_PATH,
} as const;

export type AiUsageHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const AI_USAGE_HELP_TILE_ITEMS: readonly AiUsageHelpTileItem[] = [
  {
    label: "Estimated spend",
    detail: "KPIs and daily usage summarize model activity — figures are estimates, not billing invoices.",
  },
  {
    label: "Budget caps",
    detail: "Monthly budget controls signal when spend approaches workspace limits.",
  },
  {
    label: "Workflow filters",
    detail: "Feature, user, model, and trigger filters help isolate which reviews drive cost.",
  },
  {
    label: "Plan changes",
    detail: "Open Billing and plans when estimated spend turns into subscription or wallet changes.",
  },
] as const;

export const AI_USAGE_HELP_HOW_TO_READ_STEPS = [
  "Review KPIs and honesty lines before interpreting quiet or zeroed periods.",
  "Filter by feature or model when a spike needs investigation.",
  "Open Billing and plans or model governance when spend questions turn into plan or execution-profile changes.",
] as const;

export const AI_USAGE_HELP_BILLING_HREF = "/help/billing-and-plans";

export const AI_USAGE_HELP_MODEL_GOVERNANCE_HREF = "/administration/model-governance";

export const AI_USAGE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-ai-usage-shows", title: "What AI usage shows" },
  { level: 2, id: "how-ai-usage-works", title: AI_USAGE_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
