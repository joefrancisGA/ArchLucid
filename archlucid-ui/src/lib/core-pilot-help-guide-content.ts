import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const CORE_PILOT_HELP_START_REVIEW_HREF = "/architecture/reviews/new" as const;
export const CORE_PILOT_HELP_SUMMARY_TITLE = "First review path";

export const CORE_PILOT_HELP_SUMMARY_COPY =
  "Start with evidence, run the review, finalize the architecture review, then share sponsor-ready outputs.";

export type CorePilotHelpWorkflowStep = {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly expectedOutput: string;
  readonly href: string;
  readonly ctaLabel: string;
};

export type CorePilotHelpActionCard = {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly ctaLabel: string;
};

export type CorePilotHelpDeferredItem = {
  readonly title: string;
  readonly description: string;
};

export type CorePilotHelpFirstViewportStep = {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
};

/** TB-1685 — compact three-step orientation before optional paths and Related guides. */
export const CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TITLE = "Your first review in three steps";

export const CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TEST_ID = "core-pilot-first-viewport-job-chrome";

export const CORE_PILOT_HELP_FIRST_VIEWPORT_STEPS: readonly CorePilotHelpFirstViewportStep[] = [
  {
    stepNumber: 1,
    title: "Start a review",
    description: "Open New architecture review — choose no cloud target when you are evidence-only.",
  },
  {
    stepNumber: 2,
    title: "Add evidence",
    description: "Attach briefs, diagrams, documents, IaC, or exports on review detail.",
  },
  {
    stepNumber: 3,
    title: "Finalize and share",
    description: "Run the review, finalize the package, and export sponsor-ready outputs.",
  },
];

const sampleReviewHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/** TB-1332: name the curated Claims Intake showcase — not a bare "sample review" label. */
export const CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL =
  `Open ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} sample review` as const;

export const CORE_PILOT_HELP_WORKFLOW_STEPS: readonly CorePilotHelpWorkflowStep[] = [
  {
    stepNumber: 1,
    title: "Start review",
    description:
      "Open New architecture review and name what you want reviewed — goals, constraints, and scope. Saving an architecture draft is optional and separate from starting a review.",
    expectedOutput: "A new architecture review on your reviews list.",
    href: CORE_PILOT_HELP_START_REVIEW_HREF,
    ctaLabel: BUYER_START_ARCHITECTURE_REVIEW_CTA,
  },
  {
    stepNumber: 2,
    title: "Add evidence",
    description:
      "After you start a review, attach briefs, diagrams, documents, IaC, or exports on review detail. Cloud connectors and Administration inventory ZIP upload are optional advanced paths.",
    expectedOutput: "Evidence linked to the architecture review before analysis runs.",
    href: CORE_PILOT_HELP_START_REVIEW_HREF,
    ctaLabel: "Start a review to add evidence",
  },
  {
    stepNumber: 3,
    title: "Monitor review progress",
    description: "Watch progress on review detail until findings are ready to finalize.",
    expectedOutput: "Findings and evidence labels ready for your review.",
    href: "/architecture/reviews/new",
    ctaLabel: "Open review detail",
  },
  {
    stepNumber: 4,
    title: "Finalize review",
    description:
      "Finalize when ready — this locks the signed review record, findings, and export surfaces on the architecture review.",
    expectedOutput: "A finalized architecture review with artifacts and audit trail.",
    href: "/architecture/reviews/new",
    ctaLabel: "Finalize on review detail",
  },
  {
    stepNumber: 5,
    title: "Share outputs",
    description: "Download sponsor exports and share proof with stakeholders when your internal review is complete.",
    expectedOutput: "Sponsor packet, board materials, or markdown exports.",
    href: "/architecture/reviews/new",
    ctaLabel: "Open exports",
  },
];

export const CORE_PILOT_HELP_CLOUD_ACTIONS: readonly CorePilotHelpActionCard[] = [
  {
    title: "Connect cloud provider",
    description: "Optional read-only connections for Azure, AWS, or GCP when live inventory is needed.",
    href: "/integrations/cloud-connections",
    ctaLabel: "Cloud connections",
  },
  {
    title: "Security intake checklist",
    description: "Share with InfoSec before enabling connectors in regulated environments.",
    href: inAppHelpHref("cloud-connections"),
    ctaLabel: "Cloud connections guide",
  },
  {
    title: "Evidence-only review",
    description:
      "Start without cloud connectors — attach files on review detail. For workspace-wide inventory ZIP imports, use Administration → Extract & Upload after review intake.",
    href: CORE_PILOT_HELP_START_REVIEW_HREF,
    ctaLabel: "Start evidence-only review",
  },
];
export const CORE_PILOT_HELP_DEFERRED_ITEMS: readonly CorePilotHelpDeferredItem[] = [
  {
    title: "Compare, replay, and portfolio graph at scale",
    description: "Use after your first finalized review when you need change analysis across packages.",
  },
  {
    title: "Advanced policy packs",
    description: "Add when governance templates are in scope for the pilot — not required for first value.",
  },
  {
    title: "ITSM and chat connectors",
    description: "Jira, ServiceNow, Confluence, Slack, and Teams — configure when workflow automation is needed.",
  },
];

/** TB-1334: single post-stepper optional cluster title. */
export const CORE_PILOT_HELP_OPTIONAL_PATHS_TITLE = "Optional paths for your first review";

export const CORE_PILOT_HELP_OPTIONAL_PATHS_SUMMARY =
  "Cloud connectors are optional. You can run an evidence-only review first, then add connectors or advanced topics later.";

export const CORE_PILOT_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "first-review-path", title: CORE_PILOT_HELP_SUMMARY_TITLE },
  { level: 2, id: "run-the-first-review", title: "Run the first review" },
  { level: 2, id: "optional-paths", title: CORE_PILOT_HELP_OPTIONAL_PATHS_TITLE },
  { level: 2, id: "ready-to-begin", title: "Ready to begin?" },
];

/** Hero + secondary actions for `/help/first-architecture-review` — no recursive pilot-guide link (TB-1040). */
export const CORE_PILOT_HELP_PRIMARY_ACTIONS = {
  startReview: { href: CORE_PILOT_HELP_START_REVIEW_HREF, label: BUYER_START_ARCHITECTURE_REVIEW_CTA },
  sampleReview: { href: sampleReviewHref, label: CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL },
  troubleshooting: { href: inAppHelpHref("troubleshooting"), label: "Troubleshooting" },
} as const;

export const CORE_PILOT_HELP_DISCLOSURE = {
  whatThisGuideCovers: {
    title: "What this guide covers",
    body:
      "This page is your guided path from an empty workspace to a finalized architecture review. " +
      "It focuses on evidence intake, running the assessment, finalizing findings, and sharing sponsor-ready exports. " +
      "Template-specific walkthroughs and deeper configuration live in related guides below.",
  },
  whenToUseCloudConnectors: {
    title: "When to use cloud connectors",
    body:
      "Connect Azure, AWS, or GCP when the review needs live inventory, configuration, identity, policy, cost, or operational signals. " +
      "You can run an evidence-only review first, then connect a provider later when source-system evidence is required. " +
      "Share the cloud connections guide with your security team before enabling read-only access.",
  },
  whatCanWaitUntilLater: {
    title: "What can wait until later",
    body:
      "Compare, replay, portfolio graph, advanced policy packs, and ITSM or chat connectors are available in the product — " +
      "they are not prerequisites for proving first review value. Export handoff covers sponsor sharing until connectors are configured.",
  },
} as const;

/** TB-1335: distinct related-guide label — not another “First review guide” twin. */
export const CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL = "In-product checklist";

export const CORE_PILOT_HELP_DEPTH_GUIDES: readonly { readonly label: string; readonly href: string }[] = [
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
  { label: CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL, href: FIRST_REVIEW_GUIDE_PATH },
];

export const CORE_PILOT_HELP_HOME_STATUS_NOTE =
  "The home page shows your next recommended action after each review step.";

/** TB-1333: neutral copy while commit context loads — never impersonate finalize/export CTAs. */
export const CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS = "Checking workspace status…";
