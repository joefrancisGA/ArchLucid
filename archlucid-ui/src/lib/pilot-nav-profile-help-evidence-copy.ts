import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PILOT_NAV_PROFILE_HELP_CANONICAL_PATH = "/help/pilot-nav-profile" as const;

export const PILOT_NAV_PROFILE_HELP_CLAIM_DISCIPLINE =
  "This workspace navigation profile guide orients architects on progressive sidebar unlock after the first finalized architecture review — it is help orientation, not a signed-review diligence Sources package from your tenant. Open Start a review or Getting started when you need the live first-review path.";

export const PILOT_NAV_PROFILE_HELP_SOURCES_INTRO =
  "Use these follow-ups when navigation-profile vocabulary turns into the first-review workflow, path chooser goals, or live Operate unlock controls.";

export type PilotNavProfileHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/pilot-nav-profile`. */
export const PILOT_NAV_PROFILE_HELP_SOURCES: readonly PilotNavProfileHelpSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "First architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Review guide", href: inAppHelpHref("review-guide") },
  { label: "Choose your next step", href: inAppHelpHref("path-chooser") },
  { label: "Start a review", href: "/architecture/reviews/new" },
] as const;
