import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  EVIDENCE_GRAPH_CANONICAL_PATH,
  EVIDENCE_GRAPH_HELP_TOPIC_LABEL,
} from "@/lib/evidence-graph-evidence-copy";
import {
  EVIDENCE_GRAPH_PAGE_SUBTITLE,
  EVIDENCE_GRAPH_PAGE_TITLE,
} from "@/lib/evidence-graph-page";

export const EVIDENCE_GRAPH_HELP_PAGE_TITLE = EVIDENCE_GRAPH_PAGE_TITLE;

export const EVIDENCE_GRAPH_HELP_PAGE_SUBTITLE = EVIDENCE_GRAPH_PAGE_SUBTITLE;

export const EVIDENCE_GRAPH_HELP_OVERVIEW =
  "The evidence graph shows how evidence connects to findings, decisions, approvals, and audit records for a selected finalized review. Use it to explore relationships before briefing sponsors — not as a signed-review diligence Sources package.";

export const EVIDENCE_GRAPH_HELP_PRIMARY_ACTION = {
  label: "Open evidence graph",
  href: EVIDENCE_GRAPH_CANONICAL_PATH,
} as const;

export type EvidenceGraphHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const EVIDENCE_GRAPH_HELP_FEATURE_ITEMS: readonly EvidenceGraphHelpItem[] = [
  {
    label: "Review selection",
    detail: "Pick a completed review to load its graph, or open the sample graph to learn the layout.",
  },
  {
    label: "Node relationships",
    detail: "Trace how evidence supports findings, decisions, approvals, and audit trail entries.",
  },
  {
    label: "Path highlighting",
    detail: "Focus a selection or highlight a path when you need to explain a specific chain.",
  },
  {
    label: "Evidence trail export",
    detail: "Open trace presentation when you need a tabular export of the graph chain.",
  },
] as const;

export const EVIDENCE_GRAPH_HELP_HOW_TO_READ_STEPS = [
  "Select a finalized review or open the sample graph to see how nodes connect.",
  "Click nodes to inspect findings, decisions, or audit records tied to the evidence chain.",
  "Open search or compare when graph questions turn into cross-review analysis.",
] as const;

export const EVIDENCE_GRAPH_HELP_EVIDENCE_TRAIL_HREF = "/help/evidence-trail";

export const EVIDENCE_GRAPH_HELP_SEARCH_HREF = "/insights/search-review-evidence";

export const EVIDENCE_GRAPH_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-evidence-graph-shows", title: "What the evidence graph shows" },
  { level: 2, id: "how-evidence-graph-works", title: EVIDENCE_GRAPH_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
