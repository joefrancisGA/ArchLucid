import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_COMPARE_OPEN_EVIDENCE_TRAIL_CTA,
  BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import {
  getShowcaseEvidenceTrailHref,
  getShowcaseManifestHref,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { reviewSignedRecordPath } from "@/lib/signed-records-paths";
import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
} from "@/lib/showcase-static-demo";

export type CompareRelatedReviewLinksProps = {
  /** Preferred run for signed-record / evidence CTAs — usually the updated (later) selection. */
  readonly preferredRunId?: string;
  readonly baselineRunId?: string;
  readonly updatedRunId?: string;
};

function resolvePreferredRunId(props: CompareRelatedReviewLinksProps): string | null {
  const updated = canonicalizeDemoRunId((props.updatedRunId ?? "").trim());
  const preferred = canonicalizeDemoRunId((props.preferredRunId ?? "").trim());
  const baseline = canonicalizeDemoRunId((props.baselineRunId ?? "").trim());

  if (preferred.length > 0) {
    return preferred;
  }

  if (updated.length > 0) {
    return updated;
  }

  if (baseline.length > 0) {
    return baseline;
  }

  if (isStaticDemoPayloadFallbackEnabled()) {
    return SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID;
  }

  return null;
}

/** Secondary navigation to related review artifacts — pair-scoped when run ids are known. */
export function CompareRelatedReviewLinks(props: CompareRelatedReviewLinksProps = {}) {
  const runId = resolvePreferredRunId(props);

  if (runId === null) {
    return null;
  }

  const isShowcasePair =
    runId === SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID ||
    runId === SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID ||
    canonicalizeDemoRunId((props.baselineRunId ?? "").trim()) === SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID;

  const signedHref = isShowcasePair ? getShowcaseManifestHref() : reviewSignedRecordPath(runId);
  const evidenceHref = isShowcasePair
    ? getShowcaseEvidenceTrailHref()
    : evidenceGraphHref({ runId });

  return (
    <nav
      aria-label="Related review views"
      className="flex max-w-3xl flex-wrap gap-2"
      data-testid="compare-related-review-links"
    >
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href={signedHref}>{BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA}</Link>
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href={evidenceHref}>{BUYER_COMPARE_OPEN_EVIDENCE_TRAIL_CTA}</Link>
      </Button>
    </nav>
  );
}
