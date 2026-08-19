import Link from "next/link";

import { OperatorWarningCallout } from "@/components/operator/OperatorShellMessage";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { cn } from "@/lib/utils";

/** Used when the server-derived blocked sentence is missing so the callout never renders bare. */
const COMMIT_BLOCKING_FALLBACK_REASON =
  "One or more required finding checks did not complete for this review.";

type CommitBlockingFindingsBannerProps = {
  readonly runId: string;
  /** Server-derived sentence explaining why finalize is blocked (run detail presentation). */
  readonly reason: string | null;
};

function resolveBlockedSentence(reason: string | null): string {
  const trimmed = reason?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : COMMIT_BLOCKING_FALLBACK_REASON;
}

/**
 * Above-fold callout naming the real finalize blocker (failed finding coverage) and
 * linking to the review Findings tab. Finding coverage blocks at engine level, so there
 * are no per-finding ids to deep-link to.
 */
export function CommitBlockingFindingsBanner(props: CommitBlockingFindingsBannerProps) {
  const runId = props.runId?.trim() ?? "";

  if (runId.length === 0) {
    return null;
  }

  return (
    <OperatorWarningCallout>
      <strong>Finalize is blocked by finding coverage</strong>
      <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
        {resolveBlockedSentence(props.reason)}
      </p>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
        <Link
          href={buildReviewDetailTabHref(runId, "findings")}
          prefetch={false}
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
          data-testid="commit-blocking-findings-open-findings"
        >
          Open the Findings tab
        </Link>
      </p>
    </OperatorWarningCallout>
  );
}
