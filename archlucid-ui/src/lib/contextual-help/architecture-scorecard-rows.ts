/** Architecture scorecard hub and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { ARCHITECTURE_SCORECARD_HELP_CANONICAL_PATH } from "@/lib/architecture-scorecard-help-evidence-copy";

const ARCHITECTURE_SCORECARD_PATH = "/insights/architecture-scorecard" as const;

const ARCHITECTURE_SCORECARD_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Architecture scorecard — workspace throughput tiles and a directional review-time savings model for pilot discussions.",
  whatToDoNext:
    "Finalize reviews to populate tiles, then tune ROI assumptions or open ROI summary for sponsor exports.",
  whyEmpty: "Tiles stay empty until you finalize architecture reviews in this workspace.",
  whereToConfigurePrerequisite:
    "Save ROI assumptions on this page when you have Execute authority, or use workspace baseline settings.",
  whatToDoNextAction: {
    label: "Open ROI summary",
    href: "/insights/roi-summary",
  },
  whereToConfigureAction: {
    label: "Open baseline settings",
    href: "/administration/baseline",
  },
  taskSteps: [
    "Finalize reviews so throughput tiles populate for this workspace.",
    "Tune ROI assumptions when sponsors ask how savings are estimated.",
    "Open ROI summary when you need an exportable sponsor view.",
  ],
} as const;

export const ARCHITECTURE_SCORECARD_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: ARCHITECTURE_SCORECARD_PATH,
    entry: ARCHITECTURE_SCORECARD_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: ARCHITECTURE_SCORECARD_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Architecture scorecard — how throughput tiles and directional savings are read, and how they differ from ROI summary and baseline settings.",
      whatToDoNext: "Open the scorecard to review tiles, then follow methodology help when sponsors ask how savings are calculated.",
      whyEmpty: "This guide is always available; tiles populate after finalized reviews exist in scope.",
      whereToConfigurePrerequisite:
        "Baseline settings capture review-cycle inputs used in directional savings models.",
      whatToDoNextAction: {
        label: "Open architecture scorecard",
        href: ARCHITECTURE_SCORECARD_PATH,
      },
    },
  },
];
