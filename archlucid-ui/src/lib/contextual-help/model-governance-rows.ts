/** Model governance surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  MODEL_GOVERNANCE_HELP_TOPIC_LABEL,
  MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
} from "@/lib/model-governance-settings-evidence-copy";
import { MODEL_GOVERNANCE_HELP_CANONICAL_PATH } from "@/lib/model-governance-help-evidence-copy";

const MODEL_GOVERNANCE_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "AI and model governance - manage the workspace default execution profile and governed model aliases used on reviews.",
  whatToDoNext:
    "Review the effective profile, set or clear a tenant override, then open AI usage when spend signals need attention.",
  whyEmpty:
    "Catalog rows load after the model-governance API responds; empty registries mean aliases are not published yet.",
  whereToConfigurePrerequisite:
    "Changing execution profiles needs Admin authority in this workspace.",
} as const;

export const MODEL_GOVERNANCE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
    entry: MODEL_GOVERNANCE_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: MODEL_GOVERNANCE_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Model governance — ${MODEL_GOVERNANCE_HELP_TOPIC_LABEL.toLowerCase()} and when to open AI usage or billing help.`,
      whatToDoNext:
        "Open AI and model governance to review profiles and aliases, then follow AI usage help when spend signals need attention.",
      whyEmpty: "This guide is always available; catalog rows load after the model-governance API responds.",
      whereToConfigurePrerequisite:
        "AI usage help covers estimated spend and workflow cost filters for the workspace.",
      whatToDoNextAction: {
        label: "Open AI and model governance",
        href: MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read AI usage help",
        href: "/help/ai-usage",
      },
    },
  },
];
