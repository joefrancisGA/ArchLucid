"use client";

import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

export type GovernanceFindingsQueueContextStripProps = {
  readonly freshnessLabel: string;
  readonly lastRefreshedAt: Date | null;
  readonly scopeLabel: string;
  readonly resultsLabel: string;
  readonly filterSummary: string | null;
};

export function GovernanceFindingsQueueContextStrip(props: GovernanceFindingsQueueContextStripProps) {
  return (
    <div
      className={cn(
        "sticky top-[calc(var(--app-shell-sticky,6rem)+0.25rem)] z-[5] flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-950/95",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="governance-findings-queue-context-strip"
    >
      <OperatorPageFreshnessMetadata
        testId="governance-findings-queue-context-freshness"
        lastRefreshedAt={props.lastRefreshedAt}
      >
        {props.freshnessLabel}
      </OperatorPageFreshnessMetadata>
      <span className="text-al-text-secondary" aria-hidden>
        ·
      </span>
      <span className="min-w-0 text-al-text-secondary" data-testid="governance-findings-queue-context-scope">
        {props.scopeLabel}
      </span>
      <span className="text-al-text-secondary" aria-hidden>
        ·
      </span>
      <StatusTag kind="neutral" label={props.resultsLabel} />
      {props.filterSummary !== null ? (
        <>
          <span className="text-al-text-secondary" aria-hidden>
            ·
          </span>
          <span
            className="min-w-0 truncate text-al-text-primary"
            data-testid="governance-findings-queue-context-filters"
          >
            {props.filterSummary}
          </span>
        </>
      ) : null}
    </div>
  );
}
