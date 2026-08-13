import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,
  ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA } from "@/lib/architecture/architecture-intelligence-route-metadata";

export const ARCHITECTURE_INTELLIGENCE_HELP_PAGE_TITLE =
  typeof ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA.title === "string"
    ? ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA.title
    : "Architecture intelligence";

export const ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE =
  ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA.description ??
  "Run closed-loop architecture reasoning or the golden regression harness against a product review or free-form description.";

export const ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW =
  "Architecture intelligence runs closed-loop reasoning or the golden regression harness against a description, then lets you publish structured findings into the workspace review trail when output is ready.";

export const ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION = {
  label: "Open architecture intelligence",
  href: ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,
} as const;

export type ArchitectureIntelligenceHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS: readonly ArchitectureIntelligenceHelpItem[] = [
  {
    label: "Reasoning runs",
    detail: "Submit a description and run architecture reasoning to produce structured findings and framing questions.",
  },
  {
    label: "Golden harness",
    detail: "Use the golden regression harness when you need repeatable evaluation against known architecture scenarios.",
  },
  {
    label: "Publish to findings",
    detail: "Attach approved output to the workspace findings trail when reasoning is ready for governance follow-up.",
  },
  {
    label: "Review intake",
    detail: "Open Start a review when reasoning output should become a full evidence-backed architecture review.",
  },
] as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_HOW_TO_READ_STEPS = [
  "Paste or edit an architecture description, then choose Run architecture reasoning or Run golden harness.",
  "Review structured output and framing questions before publishing anything to findings.",
  "Open Findings, Start a review, or Audit when output needs live triage or assurance trails.",
] as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_FINDINGS_HREF = "/governance/findings";

export const ARCHITECTURE_INTELLIGENCE_HELP_REVIEWS_NEW_HREF = "/architecture/reviews/new";

export const ARCHITECTURE_INTELLIGENCE_HELP_EVIDENCE_GRAPH_HREF = "/insights/evidence-graph";

export const ARCHITECTURE_INTELLIGENCE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-architecture-intelligence-does", title: "What architecture intelligence does" },
  { level: 2, id: "how-architecture-intelligence-works", title: ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
