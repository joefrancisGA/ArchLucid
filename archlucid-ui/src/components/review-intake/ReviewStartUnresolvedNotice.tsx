"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_START_UNRESOLVED_HEADLINE,
  REVIEW_START_UNRESOLVED_MESSAGE,
  REVIEW_START_UNRESOLVED_OPEN_REVIEWS_CTA,
  REVIEW_START_UNRESOLVED_RECHECK_CTA,
  REVIEW_START_UNRESOLVED_RECHECK_PENDING_LABEL,
} from "@/lib/review-start-progress-copy";
import { cn } from "@/lib/utils";

const REVIEWS_HUB_HREF = "/architecture/reviews";

export type ReviewStartUnresolvedNoticeProps = {
  /** Replays the original idempotency key, so it resolves to exactly one review either way. */
  readonly onRecheck: () => void;
  readonly isRechecking: boolean;
  readonly correlationId?: string | null;
  readonly testId?: string;
};

/**
 * Shown when the client stopped waiting on create but the server was never told to stop.
 * Framed as unfinished rather than failed — see {@link REVIEW_START_UNRESOLVED_MESSAGE}.
 */
export function ReviewStartUnresolvedNotice(
  props: ReviewStartUnresolvedNoticeProps,
): React.ReactElement {
  const { onRecheck, isRechecking, correlationId, testId } = props;
  const headingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="status"
      data-testid={testId ?? "review-start-unresolved-notice"}
      className={cn("space-y-3 py-3", DESIGN_TOKENS.callout.warn)}
    >
      <p
        ref={headingRef}
        tabIndex={-1}
        className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}
      >
        {REVIEW_START_UNRESOLVED_HEADLINE}
      </p>

      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{REVIEW_START_UNRESOLVED_MESSAGE}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={isRechecking}
          aria-busy={isRechecking}
          onClick={onRecheck}
          data-testid="review-start-unresolved-recheck"
        >
          {isRechecking
            ? REVIEW_START_UNRESOLVED_RECHECK_PENDING_LABEL
            : REVIEW_START_UNRESOLVED_RECHECK_CTA}
        </Button>

        <Button asChild variant="outline">
          <Link href={REVIEWS_HUB_HREF} data-testid="review-start-unresolved-open-reviews">
            {REVIEW_START_UNRESOLVED_OPEN_REVIEWS_CTA}
          </Link>
        </Button>
      </div>

      {correlationId !== null && correlationId !== undefined && correlationId.length > 0 ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="review-start-unresolved-correlation-id"
        >
          Correlation ID: <code>{correlationId}</code>
        </p>
      ) : null}
    </div>
  );
}
