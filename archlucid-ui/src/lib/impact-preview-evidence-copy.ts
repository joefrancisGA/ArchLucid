import {
  IMPACT_PREVIEW_ADVISORY_HREF,
  IMPACT_PREVIEW_PLANNING_HREF,
  IMPACT_PREVIEW_REVIEWS_HREF,
} from "@/lib/impact-preview-page-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const IMPACT_PREVIEW_CLAIM_DISCIPLINE =
  "Impact preview simulations are review-time what-if analysis against a finalized baseline — not production observation and not a signed-review diligence Sources package by themselves. Open Reviews or Compare before briefing sponsors.";

export const IMPACT_PREVIEW_SOURCES_INTRO =
  "Choose a proposed change and baseline below, then open Reviews, Planning, or Compare when you need orientation before treating the simulation as authoritative.";


/** Operator Sources — no self-href to impact-preview. */
export const IMPACT_PREVIEW_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: IMPACT_PREVIEW_REVIEWS_HREF },
  { label: "Planning", href: IMPACT_PREVIEW_PLANNING_HREF },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Advisory scans", href: IMPACT_PREVIEW_ADVISORY_HREF },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const IMPACT_PREVIEW_CANONICAL_PATH = "/insights/impact-preview" as const;
