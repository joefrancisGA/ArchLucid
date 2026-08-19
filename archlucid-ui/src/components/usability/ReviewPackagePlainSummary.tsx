"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { StatusTag } from "@/components/ui/status-tag";

type ReviewPackagePlainSummaryProps = {
  readonly blockingFindingCount: number;
  readonly advisoryFindingCount: number;
  readonly overallRiskLabel: string;
  readonly className?: string;
};

/** One-line plain-language summary at the top of committed reviews. */
export function ReviewPackagePlainSummary(props: ReviewPackagePlainSummaryProps) {
  const total = props.blockingFindingCount + props.advisoryFindingCount;

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50",
        OPERATOR_LAYOUT.cardPadding,
        props.className,
      )}
      data-testid="review-package-plain-summary"
      role="status"
    >
      <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-semibold">{total} finding{total === 1 ? "" : "s"}</span>
        {props.blockingFindingCount > 0 ? (
          <>
            {" "}
            — <span className="font-medium">{props.blockingFindingCount} blocking</span>
          </>
        ) : null}
        {props.advisoryFindingCount > 0 ? (
          <>
            {props.blockingFindingCount > 0 ? ", " : " — "}
            <span>{props.advisoryFindingCount} advisory</span>
          </>
        ) : null}
        <span className="mx-2 text-neutral-400" aria-hidden>
          ·
        </span>
        Overall risk:{" "}
        <StatusTag kind="neutral" label={props.overallRiskLabel} className="align-middle" />
      </p>
    </div>
  );
}
