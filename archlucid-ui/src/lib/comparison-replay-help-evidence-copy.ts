import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const COMPARISON_REPLAY_HELP_CANONICAL_PATH = "/help/comparison-replay" as const;

export const COMPARISON_REPLAY_HELP_TOPIC_LABEL = "How to compare and replay reviews";

export const COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE =
  "This Compare and replay guide orients architects on diffing two architecture reviews and validating a finalized package — it is help orientation, not a sealed-review diligence Sources package. Open Compare two reviews or Validate review when you need live workspace tools.";

export const COMPARISON_REPLAY_HELP_SOURCES_INTRO =
  "Use these follow-ups when compare/replay vocabulary turns into live diffs, validation, or a follow-up architecture review.";

/** Operator Sources — no self-href to `/help/comparison-replay`. */
export const COMPARISON_REPLAY_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Validate review", href: "/internal/validate-route" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
] as const;
