/** Model policy surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  MODEL_GOVERNANCE_HELP_TOPIC_LABEL,
  MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
} from "@/lib/model-governance-settings-evidence-copy";
import { MODEL_GOVERNANCE_HELP_CANONICAL_PATH } from "@/lib/model-governance-help-evidence-copy";

const MODEL_GOVERNANCE_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "AI and model policy - manage the workspace default execution profile and approved model aliases used on reviews.",
  whatToDoNext:
    "Review the effective profile, set or clear a tenant override, then open AI usage when spend signals need attention.",
  whyEmpty:
    "Catalog rows load after the model-governance API responds; empty registries mean aliases are not published yet.",
  whereToConfigurePrerequisite:
    "Changing execution profiles needs Admin authority in this workspace.",
  taskSteps: [
    "Review the effective execution profile for this workspace.",
    "Set or clear tenant overrides for approved model aliases.",
    "Open AI usage when spend signals need follow-up.",
  ],
} as const;

export const MODEL_GOVERNANCE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
    entry: MODEL_GOVERNANCE_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: MODEL_GOVERNANCE_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Model policy — ${MODEL_GOVERNANCE_HELP_TOPIC_LABEL.toLowerCase()} and when to open AI usage or billing help.`,
      whatToDoNext:
        "Open AI and model policy to review profiles and aliases, then follow AI usage help when spend signals need attention.",
      whyEmpty: "This guide is always available; catalog rows load after the model-governance API responds.",
      whereToConfigurePrerequisite:
        "AI usage help covers estimated spend and workflow cost filters for the workspace.",
      whatToDoNextAction: {
        label: "Open AI and model policy",
        href: MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read AI usage help",
        href: "/help/ai-usage",
      },
    },
  },
];
