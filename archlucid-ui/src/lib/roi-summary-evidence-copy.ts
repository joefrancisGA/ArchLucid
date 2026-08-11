import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ROI_SUMMARY_CANONICAL_PATH = "/insights/roi-summary";

export const ROI_SUMMARY_CLAIM_DISCIPLINE =
  "ROI summary hours and dollar estimates are directional portfolio metrics for the selected window — they are not invoices, audited financial reporting, or a signed-review evidence package. Open Architecture reviews, Evidence trail, or Trust Center when you need sponsor-safe trails.";

export const ROI_SUMMARY_SOURCES_INTRO =
  "Use these follow-ups when ROI summary needs architecture reviews, methodology context, or assurance cites.";


/** Operator Sources — no self-href to ROI summary. */
export const ROI_SUMMARY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Executive dashboard", href: "/architecture/executive-dashboard" },
  { label: "Executive summary", href: "/insights/executive-summary" },
  { label: "ROI methodology help", href: inAppHelpHref("executive-summary") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
