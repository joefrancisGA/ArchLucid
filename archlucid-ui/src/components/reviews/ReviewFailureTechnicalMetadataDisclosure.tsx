"use client";

import type { ReactElement } from "react";

import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import {
  formatReviewFailureTechnicalMetadataRows,
  hasReviewFailureTechnicalMetadata,
  type ReviewFailureTechnicalMetadataInput,
} from "@/lib/format-review-failure-technical-metadata";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import type { RunSummary } from "@/types/authority";
import { cn } from "@/lib/utils";

export type ReviewFailureTechnicalMetadataDisclosureProps = {
  readonly runId: string;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly pipelineSummary?: RunSummary | null;
  readonly failureRecordedAtUtc?: string | null;
  readonly retryCount?: number | null;
};

/** Structured failure metadata for technically sophisticated operators (Do this next). */
export function ReviewFailureTechnicalMetadataDisclosure(
  props: ReviewFailureTechnicalMetadataDisclosureProps,
): ReactElement | null {
  const input: ReviewFailureTechnicalMetadataInput = {
    runId: props.runId,
    lastFailureSummary: props.lastFailureSummary ?? null,
    diagnosticContext: props.diagnosticContext ?? null,
    pipelineSummary: props.pipelineSummary ?? null,
    failureRecordedAtUtc: props.failureRecordedAtUtc ?? null,
    retryCount: props.retryCount ?? null,
  };

  if (!hasReviewFailureTechnicalMetadata(input)) {
    return null;
  }

  const rows = formatReviewFailureTechnicalMetadataRows(input);

  return (
    <details
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      open
      data-testid="review-package-failure-technical-metadata"
    >
      <summary className={cn("cursor-pointer font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Failure metadata
      </summary>
      <dl className={cn("m-0 mt-3 space-y-2", OPERATOR_TYPOGRAPHY.helper)}>
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 sm:grid-cols-[minmax(9rem,12rem)_1fr]">
            <dt className="font-medium text-al-text-primary">{row.label}</dt>
            <dd
              className={cn(
                "m-0 break-all text-al-text-secondary",
                row.monospace === true ? "font-mono" : undefined,
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
