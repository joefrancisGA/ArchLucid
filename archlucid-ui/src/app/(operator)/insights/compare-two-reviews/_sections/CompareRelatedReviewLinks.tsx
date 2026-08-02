import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_COMPARE_OPEN_EVIDENCE_TRAIL_CTA,
  BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA,
} from "@/lib/buyer-polish-copy";
import {
  getShowcaseEvidenceTrailHref,
  getShowcaseManifestHref,
} from "@/lib/buyer-safe-review-navigation";

/** Secondary navigation to related review artifacts — normal links, not journey arrows. */
export function CompareRelatedReviewLinks() {
  return (
    <nav
      aria-label="Related review views"
      className="flex max-w-3xl flex-wrap gap-2"
      data-testid="compare-related-review-links"
    >
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href={getShowcaseManifestHref()}>{BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA}</Link>
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href={getShowcaseEvidenceTrailHref()}>{BUYER_COMPARE_OPEN_EVIDENCE_TRAIL_CTA}</Link>
      </Button>
    </nav>
  );
}
