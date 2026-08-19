/** Architecture drafts list surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  ARCHITECTURE_DRAFTS_CANONICAL_PATH,
  ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL,
} from "@/lib/architecture-drafts-evidence-copy";
import { ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH } from "@/lib/architecture-drafts-help-evidence-copy";

const ARCHITECTURE_DRAFTS_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Architectures list - browse and resume saved architecture drafts before filing evidence for review.",
  whatToDoNext:
    "Open a draft to continue editing, or Create architecture when you need a new brief, then Start a review when ready.",
  whyEmpty: "Drafts appear after the architectures API responds; empty lists mean no drafts are saved yet.",
  whereToConfigurePrerequisite:
    "Drafting uses the workspace and project selected in the header switcher; listing drafts does not start a review.",
} as const;

export const ARCHITECTURE_DRAFTS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: ARCHITECTURE_DRAFTS_CANONICAL_PATH,
    entry: ARCHITECTURE_DRAFTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/architectures",
    entry: ARCHITECTURE_DRAFTS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Architecture drafts — ${ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL.toLowerCase()} and when to open review intake or first-review help.`,
      whatToDoNext:
        "Open architecture drafts to resume a saved brief, then follow first-architecture-review help when you need orientation.",
      whyEmpty: "This guide is always available; draft rows load after the architectures API responds.",
      whereToConfigurePrerequisite:
        "First-architecture-review help covers the end-to-end path from draft to finalized review.",
      whatToDoNextAction: {
        label: "Open architecture drafts",
        href: ARCHITECTURE_DRAFTS_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read first architecture review help",
        href: "/help/first-architecture-review",
      },
    },
  },
];
