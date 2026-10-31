"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatReviewDefensibilityCriticLabel } from "@/lib/reviews/review-defensibility-critic-display";
import { cn } from "@/lib/utils";

export const REVIEW_DEFENSIBILITY_ASSERTED_COUNT_NOT_STORED = "Asserted count was not stored." as const;
export const REVIEW_DEFENSIBILITY_INFERRED_COUNT_NOT_STORED = "Inferred count was not stored." as const;
export const REVIEW_DEFENSIBILITY_SKIPPED_MUST_COUNT_NOT_STORED = "Skipped MUST count was not stored." as const;

export type ReviewDefensibilityStripProps = {
  readonly assertedCount: number | null;
  readonly inferredCount: number | null;
  readonly skippedCount: number | null;
  readonly pipelineInFlight: boolean;
  readonly criticAbsent: boolean;
  readonly verdictKind?: string | null;
};

/** First-viewport provenance summary — asserted / inferred / skipped / critic posture. */
export function ReviewDefensibilityStrip(props: ReviewDefensibilityStripProps): React.JSX.Element {
  const verdictLabel =
    props.verdictKind !== null && props.verdictKind !== undefined && props.verdictKind.trim().length > 0
      ? props.verdictKind.trim()
      : null;

  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50/90 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/50"
      data-testid="review-defensibility-strip"
      role="status"
    >
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        Defensibility trail
      </p>
      <ul
        className={cn(
          "m-0 mt-1 flex flex-wrap gap-x-4 gap-y-1 list-none p-0",
          OPERATOR_TYPOGRAPHY.helper,
          "text-neutral-700 dark:text-neutral-300",
        )}
      >
        <li data-testid="review-defensibility-asserted">
          {props.assertedCount === null ? (
            <span className="font-semibold">{REVIEW_DEFENSIBILITY_ASSERTED_COUNT_NOT_STORED}</span>
          ) : (
            <>
              Asserted: <span className="font-semibold tabular-nums">{props.assertedCount}</span>
            </>
          )}
        </li>
        <li data-testid="review-defensibility-inferred">
          {props.inferredCount === null ? (
            <span className="font-semibold">{REVIEW_DEFENSIBILITY_INFERRED_COUNT_NOT_STORED}</span>
          ) : (
            <>
              Inferred: <span className="font-semibold tabular-nums">{props.inferredCount}</span>
            </>
          )}
        </li>
        <li data-testid="review-defensibility-skipped">
          {props.skippedCount === null ? (
            <span className="font-semibold">{REVIEW_DEFENSIBILITY_SKIPPED_MUST_COUNT_NOT_STORED}</span>
          ) : (
            <>
              Skipped MUST: <span className="font-semibold tabular-nums">{props.skippedCount}</span>
            </>
          )}
        </li>
        <li data-testid="review-defensibility-critic">
          Critic:{" "}
          <span className="font-semibold">
            {formatReviewDefensibilityCriticLabel(props.pipelineInFlight, props.criticAbsent)}
          </span>
        </li>
        {verdictLabel !== null ? (
          <li data-testid="review-defensibility-verdict">
            Feasibility: <span className="font-semibold">{verdictLabel}</span>
          </li>
        ) : (
          <li data-testid="review-defensibility-verdict">
            Feasibility verdict kind was not stored.
          </li>
        )}
      </ul>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Inspect asserted vs inferred inputs before you sign.
        {props.skippedCount !== null && props.skippedCount > 0
          ? " Skipped MUST questions lower confidence on those dimensions."
          : props.skippedCount === null
            ? " Skipped MUST count was not stored. A confidence effect was not stored."
            : null}
      </p>
    </div>
  );
}
