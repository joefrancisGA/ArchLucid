"use client";

import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

export type StandardsRulesContextStripProps = {
  readonly freshnessLabel: string;
  readonly lastRefreshedAt: Date | null;
  readonly scopeLabel: string;
  readonly resultsLabel: string;
};

export function StandardsRulesContextStrip(props: StandardsRulesContextStripProps) {
  return (
    <div
      className={cn(
        "sticky top-[calc(var(--app-shell-sticky,6rem)+0.25rem)] z-[5] flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-950/95",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="standards-rules-context-strip"
    >
      <OperatorPageFreshnessMetadata
        testId="standards-rules-context-freshness"
        lastRefreshedAt={props.lastRefreshedAt}
      >
        {props.freshnessLabel}
      </OperatorPageFreshnessMetadata>
      <span className="text-al-text-secondary" aria-hidden>
        ·
      </span>
      <span className="min-w-0 text-al-text-secondary" data-testid="standards-rules-context-scope">
        {props.scopeLabel}
      </span>
      <span className="text-al-text-secondary" aria-hidden>
        ·
      </span>
      <StatusTag kind="neutral" label={props.resultsLabel} />
    </div>
  );
}
