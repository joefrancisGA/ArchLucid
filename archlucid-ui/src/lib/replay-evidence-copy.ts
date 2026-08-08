import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const REPLAY_CANONICAL_PATH = "/internal/replay" as const;

export const REPLAY_CLAIM_DISCIPLINE =
  "Validate review re-checks a finalized package (reconstruct, rebuild manifest, or full regeneration) — it is not a signed-review diligence Sources package by itself. Open the review record, Evidence trail, or Audit when you need governed trails.";

export const REPLAY_SOURCES_INTRO =
  "Use these follow-ups when validation results need review context, pairwise diffs, or help on compare/replay modes.";

export type ReplaySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/internal/replay`. */
export const REPLAY_SOURCES: readonly ReplaySourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Compare and replay help", href: inAppHelpHref("comparison-replay") },
] as const;
