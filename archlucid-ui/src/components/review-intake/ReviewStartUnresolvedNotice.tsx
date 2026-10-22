"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_START_UNRESOLVED_EXHAUSTED_HEADLINE,
  REVIEW_START_UNRESOLVED_EXHAUSTED_MESSAGE,
  REVIEW_START_UNRESOLVED_HEADLINE,
  REVIEW_START_UNRESOLVED_MESSAGE,
  REVIEW_START_UNRESOLVED_OPEN_REVIEWS_CTA,
  REVIEW_START_UNRESOLVED_RECHECK_CTA,
  REVIEW_START_UNRESOLVED_RECHECK_PENDING_LABEL,
  REVIEW_START_UNRESOLVED_START_AGAIN_CTA,
} from "@/lib/review-start-progress-copy";
import { cn } from "@/lib/utils";

const REVIEWS_HUB_HREF = "/architecture/reviews";

export type ReviewStartUnresolvedNoticeProps = {
  /** Replays the wizard-session idempotent create — does not start a fresh review submission. */
  readonly onRecheck: () => void;
  readonly isRechecking: boolean;
  readonly autoRecheckExhausted?: boolean;
  readonly onStartAgain?: () => void;
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
  const {
    onRecheck,
    isRechecking,
    autoRecheckExhausted = false,
    onStartAgain,
    correlationId,
    testId,
  } = props;
  const headingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const headline = autoRecheckExhausted
    ? REVIEW_START_UNRESOLVED_EXHAUSTED_HEADLINE
    : REVIEW_START_UNRESOLVED_HEADLINE;
  const message = autoRecheckExhausted
    ? REVIEW_START_UNRESOLVED_EXHAUSTED_MESSAGE
    : REVIEW_START_UNRESOLVED_MESSAGE;

  return (
    <div
      role="status"
      data-testid={testId ?? "review-start-unresolved-notice"}
      className={cn("space-y-3 py-3", DESIGN_TOKENS.callout.info)}
    >
      <p
        ref={headingRef}
        tabIndex={-1}
        className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}
      >
        {headline}
      </p>

      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{message}</p>

      <div className="flex flex-wrap items-center gap-2">
        {!autoRecheckExhausted ? (
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
        ) : null}

        <Button asChild variant="outline">
          <Link href={REVIEWS_HUB_HREF} data-testid="review-start-unresolved-open-reviews">
            {REVIEW_START_UNRESOLVED_OPEN_REVIEWS_CTA}
          </Link>
        </Button>

        {autoRecheckExhausted && onStartAgain !== undefined ? (
          <Button
            type="button"
            variant="primary"
            disabled={isRechecking}
            aria-busy={isRechecking}
            onClick={onStartAgain}
            data-testid="review-start-unresolved-start-again"
          >
            {REVIEW_START_UNRESOLVED_START_AGAIN_CTA}
          </Button>
        ) : null}
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
