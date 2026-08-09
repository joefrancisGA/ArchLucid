import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ACCELERATOR_CHOOSER_HELP_CANONICAL_PATH = "/help/accelerator-chooser" as const;

export const ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE =
  "This guide maps buyer jobs to starter proof packs after a first finalized architecture review — architect orientation only, not a signed-review diligence Sources package from your tenant. Open Path chooser, Your first architecture review, or a live review when you need the next action.";

export const ACCELERATOR_CHOOSER_HELP_SOURCES_INTRO =
  "Use these follow-ups when accelerator vocabulary turns into path selection, a first review, or home starter packs.";

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
