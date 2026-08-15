import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const REPLAY_CANONICAL_PATH = "/internal/validate-route" as const;

export const REPLAY_HELP_TOPIC_LABEL = "How validate review works" as const;

export const REPLAY_FOLLOW_UPS_TITLE = "Where to go next";

export const REPLAY_CLAIM_DISCIPLINE =
  "Validate review re-checks a finalized package (reconstruct, rebuild manifest, or full regeneration) — it is not a sealed-review diligence Sources package by itself. Open the review record, Evidence trail, or Audit when you need governed trails.";

export const REPLAY_SOURCES_INTRO =
  "Use these follow-ups when validation results need review context, pairwise diffs, or help on compare/replay modes.";


/** Operator Sources — no self-href to `/internal/validate-route`. */
export const REPLAY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Compare and replay help", href: inAppHelpHref("comparison-replay") },
] as const;
