import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const COMPARISON_REPLAY_HELP_CANONICAL_PATH = "/help/comparison-replay" as const;

export const COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE =
  "This Compare and replay guide orients architects on diffing two architecture reviews and validating a finalized package — it is help orientation, not a signed-review diligence Sources package. Open Compare two reviews or Validate review when you need live workspace tools.";

export const COMPARISON_REPLAY_HELP_SOURCES_INTRO =
  "Use these follow-ups when compare/replay vocabulary turns into live diffs, validation, or the repeat-review stickiness loop.";


/** Operator Sources — no self-href to `/help/comparison-replay`. */
export const COMPARISON_REPLAY_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Validate review", href: "/internal/replay" },
  { label: "Repeat-review loop", href: inAppHelpHref("repeat-review-loop") },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
] as const;
