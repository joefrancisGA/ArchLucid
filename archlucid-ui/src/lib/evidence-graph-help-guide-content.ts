import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL } from "@/lib/empty-state-presets";
import {
  EVIDENCE_GRAPH_CANONICAL_PATH,
  EVIDENCE_GRAPH_HELP_TOPIC_LABEL,
} from "@/lib/evidence-graph-evidence-copy";
import { EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/evidence-graph-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EVIDENCE_GRAPH_HELP_PAGE_TITLE = "Evidence graph";

export const EVIDENCE_GRAPH_HELP_PAGE_SUBTITLE =
  "Explore how evidence connects to findings, decisions, approvals, and audit records for a finalized review.";

export const EVIDENCE_GRAPH_HELP_OVERVIEW =
  "The evidence graph shows how evidence connects to findings, decisions, approvals, and audit records for a selected finalized review. Use it to explore relationships before briefing sponsors or opening search and compare.";

export const EVIDENCE_GRAPH_HELP_START_HERE_CARD_TITLE = "Start here";

/** Sample graph honesty — Azure reference qualifier aligned with contextual-help empty guidance. */
export const EVIDENCE_GRAPH_HELP_SAMPLE_GRAPH_NOTE =
  "Graphs appear after you finalize a review, or open the sample evidence graph (Azure reference) to explore the layout — not your tenant data.";

export const EVIDENCE_GRAPH_HELP_PRIMARY_ACTION = {
  label: "Open evidence graph",
  href: EVIDENCE_GRAPH_CANONICAL_PATH,
} as const;

export const EVIDENCE_GRAPH_HELP_NODE_RELATIONSHIPS_HREF =
  `${EVIDENCE_GRAPH_CANONICAL_PATH}#knowledge-graph-canvas` as const;

/** Deep-link to the interactive graph canvas for path highlighting and selection. */
export const EVIDENCE_GRAPH_HELP_PATH_HIGHLIGHTING_HREF =
  `${EVIDENCE_GRAPH_CANONICAL_PATH}?presentation=graph#knowledge-graph-canvas` as const;

export type EvidenceGraphHelpTileItem = {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
};

export const EVIDENCE_GRAPH_HELP_TILE_ITEMS: readonly EvidenceGraphHelpTileItem[] = [
  {
    label: "Review selection",
    detail: `Pick a completed review to load its graph, or ${AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL.toLowerCase()} to learn the layout.`,
    href: REVIEWS_LIST_PATH,
  },
  {
    label: "Node relationships",
    detail: "Trace how evidence supports findings, decisions, approvals, and audit trail entries.",
    href: EVIDENCE_GRAPH_HELP_NODE_RELATIONSHIPS_HREF,
  },
  {
    label: "Path highlighting",
    detail: "Focus a selection or highlight a path when you need to explain a specific chain.",
    href: EVIDENCE_GRAPH_HELP_PATH_HIGHLIGHTING_HREF,
  },
  {
    label: "Evidence trail export",
    detail: "Open trace presentation when you need a tabular export of the graph chain.",
    href: inAppHelpHref("evidence-trail"),
  },
] as const;

export const EVIDENCE_GRAPH_HELP_HOW_TO_READ_STEPS = [
  `Select a finalized review or ${AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL.toLowerCase()} to see how nodes connect.`,
  "Click nodes to inspect findings, decisions, or audit records tied to the evidence chain.",
  "Open search or compare when graph questions turn into cross-review analysis.",
] as const;

export const EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID = "help-evidence-graph-claim-discipline-heading" as const;

export const EVIDENCE_GRAPH_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-evidence-graph-shows", title: "What the evidence graph shows" },
  { level: 2, id: "how-evidence-graph-works", title: EVIDENCE_GRAPH_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID,
    title: EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns the diligence negation once. */
export const EVIDENCE_GRAPH_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a sealed-review diligence Sources package", "not a diligence Sources package"],
  claimMustContain: "not a sealed-review diligence Sources package",
} as const;
