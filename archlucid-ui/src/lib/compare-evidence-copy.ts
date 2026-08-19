import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const COMPARE_CLAIM_DISCIPLINE =
  "Comparison output and AI narrative are directional diffs between two finalized reviews — not a sealed-review diligence Sources package by themselves. Open pair Sources after Compare before briefing sponsors.";

export const COMPARE_SOURCES_INTRO =
  "Pick two finalized reviews below, then open Reviews, Evidence trail, or Compare help when you need orientation before treating the diff as authoritative.";


/** Operator Sources — no self-href to compare-two-reviews. */
export const COMPARE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Compare and replay help", href: inAppHelpHref("comparison-replay") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const COMPARE_CANONICAL_PATH = "/insights/compare-two-reviews" as const;
