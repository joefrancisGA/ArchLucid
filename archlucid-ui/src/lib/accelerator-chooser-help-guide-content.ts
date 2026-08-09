import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import {
  ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE,
  ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH,
} from "@/lib/accelerator-chooser-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ACCELERATOR_CHOOSER_HELP_PAGE_TITLE = "Pick a starter proof pack";

export const ACCELERATOR_CHOOSER_HELP_PAGE_SUBTITLE =
  "Map buyer jobs to existing starter proof packs after your first finalized architecture review — inputs, outputs, and V1 scope labels.";

export const ACCELERATOR_CHOOSER_HELP_OVERVIEW =
  "Each row maps a buyer job to an in-product starter proof pack. Pick one primary pack, start the review intake, attach evidence, finalize, and export the proof checklist.";

export const ACCELERATOR_CHOOSER_HELP_PREREQUISITE =
  "Confirm a Core Pilot finalize exists — a signed review record on an architecture package — before starting a specialty pack.";

export const ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY = ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE;

export const ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS = {
  firstPilotPath: {
    label: "Your first architecture review",
    href: inAppHelpHref("first-architecture-review"),
  },
  pathChooser: {
    label: "Path chooser",
    href: inAppHelpHref("path-chooser"),
  },
  startReview: {
    label: BUYER_START_ARCHITECTURE_REVIEW_CTA,
    href: "/architecture/reviews/new",
  },
  baselineReview: {
    label: "New review with baseline intake",
    href: "/architecture/reviews/new?baseline=1",
  },
  quickReview: {
    label: "Quick review",
    href: "/architecture/reviews/new?path=quick-review",
  },
} as const;

export type AcceleratorChooserHelpWorkflowStep = {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly href?: string;
  readonly ctaLabel?: string;
};

export const ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS: readonly AcceleratorChooserHelpWorkflowStep[] = [
  {
    stepNumber: 1,
    title: "Confirm finalize",
    description: ACCELERATOR_CHOOSER_HELP_PREREQUISITE,
    href: inAppHelpHref("first-architecture-review"),
    ctaLabel: "First architecture review guide",
  },
  {
    stepNumber: 2,
    title: "Pick a pack",
    description: "Choose the buyer job that matches your stakeholder conversation from the starter packs below.",
  },
  {
    stepNumber: 3,
    title: "Open review intake",
    description:
      "Use baseline ZIP intake when the pack lists second-run evidence, or Quick review / Detailed wizard for greenfield presets.",
    href: ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.baselineReview.href,
    ctaLabel: ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.baselineReview.label,
  },
  {
    stepNumber: 4,
    title: "Run and export",
    description:
      "Attach pack evidence, run the assessment, finalize the architecture review, and export the proof checklist with the review.",
  },
] as const;

export const ACCELERATOR_CHOOSER_HELP_OUT_OF_SCOPE =
  "Out of scope for all V1-ready packs: live Stripe or Marketplace checkout, CPA SOC 2 attestation, public reference customers, MCP, and first-party Jira, ServiceNow, Teams, or Slack connectors (V1.1 unless separately promoted).";

export const ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH_EXPORT = ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH;
