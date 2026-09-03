"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ReviewDefensibilityStripProps = {
  readonly assertedCount: number;
  readonly inferredCount: number;
  readonly skippedCount: number;
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
          Asserted: <span className="font-semibold tabular-nums">{props.assertedCount}</span>
        </li>
        <li data-testid="review-defensibility-inferred">
          Inferred: <span className="font-semibold tabular-nums">{props.inferredCount}</span>
        </li>
        <li data-testid="review-defensibility-skipped">
          Skipped MUST: <span className="font-semibold tabular-nums">{props.skippedCount}</span>
        </li>
        <li data-testid="review-defensibility-critic">
          Critic:{" "}
          <span className="font-semibold">
            {props.criticAbsent ? "Not included in this run" : "Included"}
          </span>
        </li>
        {verdictLabel !== null ? (
          <li data-testid="review-defensibility-verdict">
            Feasibility: <span className="font-semibold">{verdictLabel}</span>
          </li>
        ) : null}
      </ul>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Inspect asserted vs inferred inputs before you sign. Skipped MUST questions lower confidence on those dimensions.
      </p>
    </div>
  );
}
