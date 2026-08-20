import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

import { buildPackagePrintBackHref } from "@/lib/package-print-view";

export const PACKAGE_PRINT_CANONICAL_PATH_PATTERN =
  "/architecture/reviews/[reviewId]/print" as const;

export const PACKAGE_PRINT_CLAIM_DISCIPLINE =
  "This print view summarizes one architecture review for screen or PDF output — not a full audit export. Open the review workspace, provenance, or sealed record when you need tenant evidence.";

export const PACKAGE_PRINT_SOURCES_INTRO =
  "Use these follow-ups when the print summary leads into package review, provenance, or diligence help.";

export function buildPackagePrintSources(runId: string): readonly EvidenceSourceLink[] {
  const encRun = encodeURIComponent(runId.trim());

  return [
    { label: "Review package", href: buildPackagePrintBackHref(runId) },
    { label: "Review provenance", href: `/architecture/reviews/${encRun}/provenance` },
    { label: "Architecture reviews", href: "/architecture/reviews" },
    { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  ] as const;
}
