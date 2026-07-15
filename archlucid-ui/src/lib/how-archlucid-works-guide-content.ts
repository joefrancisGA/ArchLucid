import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const HOW_ARCHLUCID_WORKS_SUBTITLE =
  "From architecture evidence to findings, decisions, governance records, and sponsor-ready outputs.";

export const HOW_ARCHLUCID_WORKS_DIAGRAM_STEPS = [
  "Evidence",
  "Review",
  "Findings",
  "Decisions",
  "Evidence trail",
  "Governance",
  "Exports",
] as const;

export type HowArchLucidWorksSection = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
};

export const HOW_ARCHLUCID_WORKS_SECTIONS: readonly HowArchLucidWorksSection[] = [
  {
    id: "start-with-evidence",
    title: "Start with architecture evidence",
    description:
      "Upload briefs, diagrams, documents, IaC exports, screenshots, or optional cloud inventory to open a review.",
  },
  {
    id: "analyze-policy-context",
    title: "Analyze against policy and review context",
    description:
      "ArchLucid applies your policy packs and review scope to evaluate evidence and surface structured findings.",
  },
  {
    id: "review-findings-risks",
    title: "Review findings and risks",
    description:
      "Triage prioritized findings with severity, business impact, and evidence citations before recording decisions.",
  },
  {
    id: "record-decisions",
    title: "Record decisions",
    description:
      "Capture approvals, accepted risks, remediation owners, and governance notes tied to the review.",
  },
  {
    id: "build-evidence-trail",
    title: "Build the evidence trail",
    description:
      "Link findings and decisions back to source artifacts so sponsors and reviewers can trace every conclusion.",
  },
  {
    id: "finalize-review-package",
    title: "Finalize the review",
    description:
      "Lock the governed review record when findings, decisions, and evidence coverage are ready for release.",
  },
  {
    id: "export-governance-artifacts",
    title: "Export reports and governance artifacts",
    description:
      "Download sponsor-ready summaries, proof packets, and audit materials from the finalized package.",
  },
] as const;

const sampleReviewHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

export const HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS = {
  startReview: { href: "/reviews/new", label: BUYER_START_ARCHITECTURE_REVIEW_CTA },
  sampleReview: { href: sampleReviewHref, label: "Open completed sample" },
  firstReviewGuide: { href: inAppHelpHref("first-hour-operator-path"), label: "View first review guide" },
} as const;

export const HOW_ARCHLUCID_WORKS_DATA_HANDLING_HREF = inAppHelpHref("data-handling");

export const HOW_ARCHLUCID_WORKS_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "workflow-overview", title: "Workflow overview" },
  ...HOW_ARCHLUCID_WORKS_SECTIONS.map((section) => ({
    level: 2 as const,
    id: section.id,
    title: section.title,
  })),
  { level: 2, id: "data-handling-link", title: "Data handling" },
];
