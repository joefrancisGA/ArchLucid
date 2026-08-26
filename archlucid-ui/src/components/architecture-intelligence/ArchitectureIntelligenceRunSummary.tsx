"use client";

import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";
import {
  formatArchitectureIntelligenceRunHeadline,
  listArchitectureIntelligenceRunTechnicalDetails,
} from "@/lib/architecture/architecture-intelligence-run-summary-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureIntelligenceRunSummaryProps = {
  readonly result: ClosedLoopReasoningResult;
  readonly testIdPrefix?: string;
};

/** Human-readable post-run summary with operator diagnostics behind disclosure. */
export function ArchitectureIntelligenceRunSummary(props: ArchitectureIntelligenceRunSummaryProps) {
  const prefix = props.testIdPrefix ?? "architecture-intelligence-run";
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const headline = formatArchitectureIntelligenceRunHeadline(props.result);
  const technicalDetails = listArchitectureIntelligenceRunTechnicalDetails(props.result);

  return (
    <div className="space-y-1" data-testid={`${prefix}-summary`}>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid={`${prefix}-headline`}
      >
        {headline}
      </p>

      {!buyerPolishedShell && technicalDetails.length > 0 ? (
        <details
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${prefix}-technical-details`}
        >
          <summary className="cursor-pointer select-none text-al-link underline-offset-2 hover:underline">
            Technical details
          </summary>
          <dl className="m-0 mt-2 space-y-1">
            {technicalDetails.map((detail) => (
              <div key={detail.label} className="grid gap-0.5 sm:grid-cols-[minmax(9rem,auto)_1fr] sm:gap-x-3">
                <dt className="m-0 font-medium text-al-text-primary">{detail.label}</dt>
                <dd className="m-0 break-all">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </div>
  );
}
