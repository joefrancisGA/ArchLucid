import {
  ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE,
  ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH,
} from "@/lib/accelerator-chooser-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ACCELERATOR_CHOOSER_HELP_PAGE_TITLE = "Pick an accelerator pack";

export const ACCELERATOR_CHOOSER_HELP_PAGE_SUBTITLE =
  "Map stakeholder scenarios to existing accelerator packs after your first finalized architecture review — inputs, outputs, and when not to use each pack.";

export const ACCELERATOR_CHOOSER_HELP_OVERVIEW =
  "Each row maps a stakeholder scenario to an in-product accelerator pack. Pick one primary pack, start the architecture review, attach evidence, finalize, and export the proof checklist.";

export const ACCELERATOR_CHOOSER_HELP_PREREQUISITE =
  "Specialty packs assume at least one signed review record in this tenant — finalize your first architecture review before starting a specialty pack.";

export const ACCELERATOR_CHOOSER_HELP_PREREQUISITE_TENANT_STATE = {
  checking: "Checking whether this tenant has a signed review record…",
  met: "This tenant has a finalized signed review record.",
  notMet: "No signed review record found in this tenant yet.",
  unknown: "Signed review record status is unavailable — sign in with review read access to verify.",
} as const;

export const ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY = ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE;

export const ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS = {
  firstArchitectureReview: {
    label: "Your first architecture review",
    href: inAppHelpHref("first-architecture-review"),
  },
  pathChooser: {
    label: "Path chooser",
    href: inAppHelpHref("path-chooser"),
  },
  baselineReview: {
    label: "New review with baseline intake",
    href: "/architecture/reviews/new?baseline=1",
  },
} as const;

export type AcceleratorChooserHelpWorkflowStep = {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly ctaLabel: string;
};

export const ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS: readonly AcceleratorChooserHelpWorkflowStep[] = [
  {
    stepNumber: 1,
    title: "Confirm a signed review record",
    description:
      "Specialty packs assume you already finalized at least one architecture review in this tenant.",
    href: ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href,
    ctaLabel: ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label,
  },
  {
    stepNumber: 2,
    title: "Open review intake with the pack preset",
    description:
      "Use baseline ZIP intake when the pack lists second-pass evidence, or the new-review wizard for greenfield presets.",
    href: ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.baselineReview.href,
    ctaLabel: ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.baselineReview.label,
  },
  {
    stepNumber: 3,
    title: "Finalize and export proof",
    description:
      "Attach pack evidence, finalize the architecture review, then export the proof checklist with the signed review record.",
    href: inAppHelpHref("repeat-review-loop"),
    ctaLabel: "Finalize and export guide",
  },
] as const;

export const ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH_EXPORT = ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH;
