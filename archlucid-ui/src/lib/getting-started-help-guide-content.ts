import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { buildGoldenSponsorPackageWalkthroughHref, GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA, GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TITLE } from "@/lib/golden-sponsor-package-walkthrough";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GETTING_STARTED_HELP_SUBTITLE =
  "Learn how ArchLucid turns architecture evidence into review findings, decisions, and governance-ready outputs.";

export const GETTING_STARTED_HELP_PAGE_SUBTITLE_OPERATOR = GETTING_STARTED_HELP_SUBTITLE;

export const GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER =
  "See how evidence becomes findings, decisions, and governance outputs before your first review.";

export const GETTING_STARTED_HELP_BREADCRUMB_TOPIC_TITLE = "Getting started" as const;

export function gettingStartedHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER
    : GETTING_STARTED_HELP_PAGE_SUBTITLE_OPERATOR;
}

export const GETTING_STARTED_HELP_AUDIENCE_LINE =
  "For architects, pilot teams, and sponsors who want to understand the review flow before starting.";

export const GETTING_STARTED_HELP_CLAIM_DISCIPLINE =
  "This guide orients you through the review flow — it is not a sealed-review diligence Sources package. Open Security & Trust or a finalized review before treating onboarding copy as procurement evidence.";

export const GETTING_STARTED_HELP_SOURCES_INTRO =
  "Use these follow-ups when getting-started orientation turns into a first review, path choice, or assurance questions.";

export type GettingStartedHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Diligence Sources — no self-href to /help/getting-started. Retired how-it-works topic bookmarks
 * permanently redirect to #how-archlucid-works below, so it is intentionally omitted here to avoid a self-link.
 */
export const GETTING_STARTED_HELP_SOURCES: readonly GettingStartedHelpSourceLink[] = [
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Choose your next step", href: inAppHelpHref("choose-your-next-step") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Security & Trust", href: "/assurance-status" },
] as const;

export const GETTING_STARTED_HELP_PATH = "/help/getting-started" as const;

/** Retired operator bookmark — no App Router page; help lives at GETTING_STARTED_HELP_PATH. */
export const LEGACY_GETTING_STARTED_PATH = "/getting-started" as const;

export const GETTING_STARTED_HELP_TOPIC_LABEL = "How to get started" as const;

export const GETTING_STARTED_HELP_QUICK_START_TITLE = "Start with your first review";

export const GETTING_STARTED_HELP_QUICK_START_COPY =
  "Upload evidence, run the review, inspect findings, finalize the review, and share the outputs.";

export const GETTING_STARTED_HELP_DIAGRAM_TITLE = "How ArchLucid works";

export const GETTING_STARTED_HELP_DIAGRAM_SUMMARY =
  "ArchLucid ingests architecture evidence, evaluates it against your standards, and produces a governed architecture review you can share.";

export const GETTING_STARTED_HELP_DIAGRAM_STEPS = [
  "Evidence",
  "Analyze",
  "Findings",
  "Decisions",
  "Governance outputs",
] as const;

export const GETTING_STARTED_HELP_PIPELINE_TEXT_STAGES = [
  "Architecture request opens a review session and feeds context ingestion.",
  "Authority pipeline stages: knowledge graph, findings, decisioning, and artifacts.",
  "Governance gate: allow commits the sealed review record; block or warn policy holds finalize.",
  "Committed outputs: sealed review record and downloadable exports.",
] as const;

export const GETTING_STARTED_HELP_PIPELINE_DIAGRAM_DESCRIPTION =
  "Stages from architecture request through context ingestion, authority pipeline (knowledge graph, findings, decisioning, artifacts), governance gate (allow commits the sealed review record; block or warn policy holds finalize), and committed outputs (sealed review record and exports).";

export type GettingStartedPlainLanguageTerm = {
  readonly term: string;
  readonly definition: string;
};

export const GETTING_STARTED_HELP_PLAIN_LANGUAGE_TERMS: readonly GettingStartedPlainLanguageTerm[] = [
  {
    term: "Architecture package",
    definition:
      "The durable record of findings, decisions, evidence, and exports for one architecture review.",
  },
  {
    term: "Evidence",
    definition:
      "Briefs, diagrams, documents, IaC exports, and optional cloud inventory that describe the architecture under review.",
  },
  {
    term: "Findings",
    definition:
      "Structured issues and risks surfaced during analysis, each tied to evidence and severity.",
  },
  {
    term: "Decision",
    definition:
      "A recorded disposition on review proposals—such as approve, waive, defer, or escalate—captured for governance and audit.",
  },
  {
    term: "Sealed review record",
    definition:
      "The immutable package locked when a review is finalized — the authoritative anchor for governance, exports, and evidence lineage.",
  },
  {
    term: "Evidence trail",
    definition:
      "A traceable path from each finding back to the artifacts and context that supported it.",
  },
  {
    term: "Policy pack",
    definition:
      "Versioned governance standards and rules applied to reviews for your workspace or project.",
  },
  {
    term: "Governance approval",
    definition:
      "Formal sign-off workflow when a review requires approver acknowledgement before release.",
  },
];

export type GettingStartedWorkflowStep = {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly expectedOutputs: string;
  readonly href: string;
  readonly ctaLabel: string;
};

export const GETTING_STARTED_HELP_WORKFLOW_STEPS: readonly GettingStartedWorkflowStep[] = [
  {
    stepNumber: 1,
    title: "Add architecture evidence",
    description: "Start a review and attach briefs, diagrams, documents, IaC, or optional cloud inventory.",
    expectedOutputs: "Evidence linked to the review.",
    href: "/architecture/reviews/new",
    ctaLabel: BUYER_START_ARCHITECTURE_REVIEW_CTA,
  },
  {
    stepNumber: 2,
    title: "Analyze the architecture",
    description: "Start the review and monitor progress until findings are ready to inspect.",
    expectedOutputs: "Findings with severity, impact, and evidence labels.",
    href: "/architecture/reviews",
    ctaLabel: "Open reviews",
  },
  {
    stepNumber: 3,
    title: "Review findings",
    description: "Triage issues, confirm evidence coverage, and note items that need governance follow-up.",
    expectedOutputs: "Prioritized findings ready for decisions.",
    href: "/governance/findings",
    ctaLabel: "Open findings queue",
  },
  {
    stepNumber: 4,
    title: "Record decisions",
    description: "Capture approvals, accepted risks, and remediation owners before finalizing.",
    expectedOutputs: "Architecture decisions and governance notes.",
    href: "/governance/approval-queue",
    ctaLabel: "Open governance workflow",
  },
  {
    stepNumber: 5,
    title: "Finalize and share outputs",
    description: "Lock the review and share export-ready artifacts for stakeholders.",
    expectedOutputs: "Sealed review record, evidence trail, and exports.",
    href: "/architecture/reviews",
    ctaLabel: "Open reviews",
  },
];

export type GettingStartedActionCard = {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly ctaLabel: string;
};

const sampleReviewHref = buildGoldenSponsorPackageWalkthroughHref();

export const GETTING_STARTED_HELP_PRIMARY_ACTIONS = {
  startReview: { href: "/architecture/reviews/new", label: BUYER_START_ARCHITECTURE_REVIEW_CTA },
  sampleReview: { href: sampleReviewHref, label: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA },
  firstReviewGuide: { href: inAppHelpHref("first-architecture-review"), label: "View first review guide" },
} as const;

export const GETTING_STARTED_HELP_NEXT_ACTION_CARDS: readonly GettingStartedActionCard[] = [
  {
    title: "Start your first review",
    description: "Create a review and add evidence — cloud connectors are optional.",
    href: "/architecture/reviews/new",
    ctaLabel: BUYER_START_ARCHITECTURE_REVIEW_CTA,
  },
  {
    title: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TITLE,
    description: "Walk through a labeled sample from sealed review record to export-ready outputs.",
    href: sampleReviewHref,
    ctaLabel: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
  },
  {
    title: "Learn the vocabulary",
    description: "Scan the plain-language terms used across review, governance, and exports.",
    href: "#plain-language-vocabulary",
    ctaLabel: "View vocabulary",
  },
  {
    title: "Connect cloud evidence later",
    description: "Add read-only Azure, AWS, or GCP connectors when live inventory is required.",
    href: "/integrations/cloud-connections",
    ctaLabel: "Cloud connections",
  },
];

export const GETTING_STARTED_HELP_TECHNICAL_DETAILS_TITLE = "Technical details for administrators";

export const GETTING_STARTED_HELP_TECHNICAL_DETAILS_BODY =
  "Engineering and platform teams may need the following implementation mapping when integrating ArchLucid with internal systems.";

export const GETTING_STARTED_HELP_TECHNICAL_TERMS: readonly GettingStartedPlainLanguageTerm[] = [
  {
    term: "Review session identifier (runId)",
    definition:
      "API and storage key for one architecture review session from intake through finalize.",
  },
  {
    term: "Manifest identifier",
    definition: "Immutable snapshot id produced when a review is finalized.",
  },
  {
    term: "Context snapshot",
    definition: "Normalized intake payload combining description, hints, documents, and IaC snippets.",
  },
  {
    term: "Authority orchestration",
    definition: "Server-side pipeline that coordinates architecture structure, cost, compliance, and critic agents.",
  },
  {
    term: "Explainability trace",
    definition: "Metadata attached to findings for audit and evidence inspection surfaces.",
  },
  {
    term: "Approval gate",
    definition: "Configurable blocker on finalize when severity thresholds are breached.",
  },
];

export const GETTING_STARTED_HELP_DIAGRAM_SOURCE = `flowchart LR
  subgraph ingest [Request]
    AR[Architecture request]
    R[Review session]
  end
  subgraph pipeline [Authority pipeline]
    CI[Context ingestion]
    KG[Knowledge graph stage]
    FD[Findings]
    DV[Decisioning]
    ART[Artifacts]
  end
  subgraph outputs [Committed outputs]
    SR[Sealed review record]
    PKG[Downloads / exports]
  end
  AR --> CI --> KG --> FD --> DV --> ART
  R -.created at start.- CI
  FD --> gov{Governance gate}
  gov -->|allow| SR
  gov -->|block / warn policy| gov
  SR --> PKG`;

export const GETTING_STARTED_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "quick-start", title: GETTING_STARTED_HELP_QUICK_START_TITLE },
  { level: 2, id: "how-archlucid-works", title: GETTING_STARTED_HELP_DIAGRAM_TITLE },
  { level: 2, id: "plain-language-vocabulary", title: "Plain-language vocabulary" },
  { level: 2, id: "what-happens-during-a-review", title: "What happens during a review?" },
  { level: 2, id: "what-to-do-next", title: "What to do next" },
  { level: 2, id: "technical-details", title: GETTING_STARTED_HELP_TECHNICAL_DETAILS_TITLE },
];
