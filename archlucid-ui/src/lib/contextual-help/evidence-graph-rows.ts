/** Evidence graph surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  EVIDENCE_GRAPH_CANONICAL_PATH,
  EVIDENCE_GRAPH_HELP_TOPIC_LABEL,
} from "@/lib/evidence-graph-evidence-copy";
import { EVIDENCE_GRAPH_HELP_CANONICAL_PATH } from "@/lib/evidence-graph-help-evidence-copy";

const EVIDENCE_GRAPH_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Evidence graph — inspect how evidence connects to findings, decisions, approvals, and audit records for a finalized review.",
  whatToDoNext:
    "Select a completed review, explore node relationships, then open cited findings or the evidence trail when you need detail.",
  whyEmpty: "Graphs appear after you finalize a review or open the sample graph.",
  whereToConfigurePrerequisite: "Finalize or open a review so the graph can load committed evidence.",
  whatToDoNextAction: {
    label: "Start a review",
    href: "/architecture/reviews/new",
  },
} as const;

export const EVIDENCE_GRAPH_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: EVIDENCE_GRAPH_CANONICAL_PATH,
    entry: EVIDENCE_GRAPH_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: EVIDENCE_GRAPH_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Evidence graph — ${EVIDENCE_GRAPH_HELP_TOPIC_LABEL.toLowerCase()} and when to open search or evidence trail help.`,
      whatToDoNext:
        "Open the evidence graph to select a review, then follow evidence trail or search help when exploration needs methodology.",
      whyEmpty: "This guide is always available; graphs load after you select a finalized review.",
      whereToConfigurePrerequisite:
        "Evidence trail help covers trace tables and export-oriented methodology.",
      whatToDoNextAction: {
        label: "Open evidence graph",
        href: EVIDENCE_GRAPH_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read evidence trail help",
        href: "/help/evidence-trail",
      },
    },
  },
];
