/** AI usage and cost surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  AI_USAGE_HELP_TOPIC_LABEL,
  AI_USAGE_SETTINGS_CANONICAL_PATH,
} from "@/lib/ai-usage-settings-evidence-copy";
import { AI_USAGE_HELP_CANONICAL_PATH } from "@/lib/ai-usage-help-evidence-copy";

const AI_USAGE_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "AI usage and cost — monitor estimated AI spend, remaining budget, and the workflows driving cost for this workspace.",
  whatToDoNext:
    "Review KPIs and daily usage, then open Billing & plans when budget caps or plan changes are needed.",
  whyEmpty:
    "Spend cards appear after cost-reporting data loads; quiet empty periods hide zeroed cockpit noise until activity resumes.",
  whereToConfigurePrerequisite:
    "Budget edits need a role that can manage workspace billing; estimated spend is not invoice-accurate.",
  whatToDoNextAction: {
    label: "Open billing and plans",
    href: "/administration/billing",
  },
  whereToConfigureAction: {
    label: "Open AI and model governance",
    href: "/administration/model-governance",
  },
  taskSteps: [
    "Review KPIs and daily usage for this workspace.",
    "Open Billing and plans when budget caps need adjustment.",
    "Open AI and model governance when execution profiles drive spend.",
  ],
} as const;

export const AI_USAGE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: AI_USAGE_SETTINGS_CANONICAL_PATH,
    entry: AI_USAGE_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/administration/settings/ai-usage",
    entry: AI_USAGE_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: AI_USAGE_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `AI usage — ${AI_USAGE_HELP_TOPIC_LABEL.toLowerCase()} and how estimated spend differs from billing invoices.`,
      whatToDoNext:
        "Open AI usage to review spend signals, then follow billing or AI and model governance when plan or execution-profile changes are needed.",
      whyEmpty: "This guide is always available; spend cards load after cost-reporting data responds.",
      whereToConfigurePrerequisite:
        "Billing and plans help covers subscription, wallet, and plan comparison controls.",
      whatToDoNextAction: {
        label: "Open AI usage",
        href: AI_USAGE_SETTINGS_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read billing and plans help",
        href: "/help/billing-and-plans",
      },
    },
  },
];
