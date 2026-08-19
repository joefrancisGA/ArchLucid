import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,
  ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA } from "@/lib/architecture/architecture-intelligence-route-metadata";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/architecture-intelligence-help-evidence-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const ARCHITECTURE_INTELLIGENCE_HELP_PAGE_TITLE =
  typeof ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA.title === "string"
    ? ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA.title
    : "Architecture intelligence";

export const ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE =
  "Run closed-loop architecture reasoning or repeatable baseline evaluation against a product review or free-form description.";

export const ARCHITECTURE_INTELLIGENCE_HELP_OVERVIEW =
  "Closed-loop reasoning produces structured findings and framing questions you can review before publishing anything to the workspace findings trail. Publishing is a governed follow-up — open Findings or start a review when output needs triage or an evidence-backed package.";

/** Help Start here card — governed follow-up guidance beside the primary action. */
export const ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_SCOPE_NOTE =
  "Submitting descriptions, running closed-loop reasoning, and publishing findings are governed follow-ups.";

export const ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_CARD_TITLE = "Start here";

export const ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION = {
  label: "Open architecture intelligence",
  href: ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,
} as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_REASONING_HREF =
  `${ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH}#architecture-description` as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_BASELINE_EVALUATION_HREF =
  `${ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH}#baseline-evaluation` as const;

export type ArchitectureIntelligenceHelpItem = {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
};

export const ARCHITECTURE_INTELLIGENCE_HELP_FEATURE_ITEMS: readonly ArchitectureIntelligenceHelpItem[] = [
  {
    label: "Architecture reasoning",
    detail: "Submit a description and run closed-loop architecture reasoning to produce structured findings and framing questions.",
    href: ARCHITECTURE_INTELLIGENCE_HELP_REASONING_HREF,
  },
  {
    label: "Baseline evaluation",
    detail: "Use repeatable baseline evaluation when you need consistent comparison against known architecture scenarios.",
    href: ARCHITECTURE_INTELLIGENCE_HELP_BASELINE_EVALUATION_HREF,
  },
  {
    label: "Publish to findings",
    detail: "Attach approved output to the workspace findings trail when reasoning is ready for governance follow-up.",
    href: GOVERNANCE_FINDINGS_PATH,
  },
  {
    label: "Review intake",
    detail: "Open Start a review when reasoning output should become a full evidence-backed architecture review.",
    href: REVIEWS_NEW_PATH,
  },
] as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_HOW_TO_READ_STEPS = [
  "Paste or edit an architecture description, then choose Run architecture reasoning or Run baseline evaluation.",
  "Review structured output and framing questions before publishing anything to the findings trail.",
  "Open Findings, Start a review, or Audit when output needs live triage or assurance trails.",
] as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID =
  "help-architecture-intelligence-claim-discipline-heading" as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-architecture-intelligence-does", title: "What architecture intelligence does" },
  { level: 2, id: "how-architecture-intelligence-works", title: ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID,
    title: ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns the diligence negation once. */
export const ARCHITECTURE_INTELLIGENCE_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a sealed-review diligence Sources package", "not a diligence Sources package"],
  claimMustContain: "not a sealed-review diligence Sources package",
  retentionMustAppearOnce: "retained under your workspace data-retention policy",
} as const;
