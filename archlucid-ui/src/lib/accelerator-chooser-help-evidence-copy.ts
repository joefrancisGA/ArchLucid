import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH = "/help/accelerator-chooser" as const;

export const ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE =
  "This guide maps stakeholder scenarios to accelerator packs after a first finalized architecture review — architect orientation only, not a tenant diligence evidence bundle from your workspace. Open Path chooser, Your first architecture review, or a live architecture review when you need the next action.";

export const ACCELERATOR_CHOOSER_HELP_SOURCES_INTRO =
  "Use these follow-ups when accelerator packs turn into path selection, a first review, or home starting points.";

export type AcceleratorChooserHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/accelerator-chooser`. */
export const ACCELERATOR_CHOOSER_HELP_SOURCES: readonly AcceleratorChooserHelpSourceLink[] = [
  { label: "Path chooser", href: inAppHelpHref("path-chooser") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Home", href: "/" },
] as const;
