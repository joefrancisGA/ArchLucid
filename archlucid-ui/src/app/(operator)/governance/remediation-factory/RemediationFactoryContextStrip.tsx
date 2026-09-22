"use client";

import Link from "next/link";

import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

export type RemediationFactoryContextStripProps = {
  readonly freshnessLabel: string;
  readonly lastRefreshedAt: Date | null;
  readonly selectionLabel: string | null;
  readonly scopeLabel: string;
};

export function RemediationFactoryContextStrip(props: RemediationFactoryContextStripProps) {
  return (
    <div
      className={cn(
        "sticky top-[calc(var(--app-shell-sticky,6rem)+0.25rem)] z-[5] flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-950/95",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="remediation-factory-context-strip"
    >
      <OperatorPageFreshnessMetadata
        testId="remediation-factory-context-freshness"
        lastRefreshedAt={props.lastRefreshedAt}
      >
        {props.freshnessLabel}
      </OperatorPageFreshnessMetadata>
      <span className="text-al-text-secondary" aria-hidden>
        ·
      </span>
      <span className="min-w-0 text-al-text-secondary" data-testid="remediation-factory-context-scope">
        {props.scopeLabel}
      </span>
      {props.selectionLabel !== null ? (
        <>
          <span className="text-al-text-secondary" aria-hidden>
            ·
          </span>
          <span className="min-w-0 truncate font-medium text-al-text-primary" data-testid="remediation-factory-context-selection">
            {props.selectionLabel}
          </span>
        </>
      ) : (
        <>
          <span className="text-al-text-secondary" aria-hidden>
            ·
          </span>
          <StatusTag kind="neutral" label="No row selected" />
        </>
      )}
      <Link
        href="#remediation-priority-simulator"
        className="ml-auto shrink-0 text-[color:var(--al-accent-interactive)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Jump to simulator
      </Link>
    </div>
  );
}
