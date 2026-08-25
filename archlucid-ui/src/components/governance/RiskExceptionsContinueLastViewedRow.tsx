"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RiskExceptionsContinueLastTarget } from "@/lib/resolve-continue-last-risk-exception";
import { cn } from "@/lib/utils";

export type RiskExceptionsContinueLastViewedRowProps = {
  readonly target: RiskExceptionsContinueLastTarget;
  readonly onOpen: (riskExceptionId: string) => void;
};

/** Pinned continue row for the most recently viewed risk exception. */
export function RiskExceptionsContinueLastViewedRow(
  props: RiskExceptionsContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="risk-exceptions-continue-last-viewed-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="risk-exceptions-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="risk-exceptions-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed exception
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.findingId}</span>
            {props.target.rationale.trim().length > 0 ? ` · ${props.target.rationale}` : ""}
          </p>
        </div>
        {props.target.href !== null ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            asChild
            data-testid="risk-exceptions-continue-last-viewed-open"
          >
            <Link href={props.target.href}>Open finding</Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            data-testid="risk-exceptions-continue-last-viewed-open"
            onClick={() => {
              props.onOpen(props.target.riskExceptionId);
            }}
          >
            Open exception
          </Button>
        )}
      </div>
    </section>
  );
}
