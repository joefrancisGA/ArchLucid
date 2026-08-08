import {
  IMPACT_PREVIEW_ADVISORY_HREF,
  IMPACT_PREVIEW_PLANNING_HREF,
  IMPACT_PREVIEW_REVIEWS_HREF,
} from "@/lib/impact-preview-page-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const IMPACT_PREVIEW_CLAIM_DISCIPLINE =
  "Impact preview simulations are review-time what-if analysis against a finalized baseline — not production observation and not a signed-review diligence Sources package by themselves. Open Reviews or Compare before briefing sponsors.";

export const IMPACT_PREVIEW_SOURCES_INTRO =
  "Choose a proposed change and baseline below, then open Reviews, Planning, or Compare when you need orientation before treating the simulation as authoritative.";

export type ImpactPreviewSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to impact-preview. */
export const IMPACT_PREVIEW_SOURCES: readonly ImpactPreviewSourceLink[] = [
  { label: "Architecture reviews", href: IMPACT_PREVIEW_REVIEWS_HREF },
  { label: "Planning", href: IMPACT_PREVIEW_PLANNING_HREF },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Advisory scans", href: IMPACT_PREVIEW_ADVISORY_HREF },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const IMPACT_PREVIEW_CANONICAL_PATH = "/insights/impact-preview" as const;
