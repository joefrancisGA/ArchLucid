import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { GovernanceSetupProgressSummary } from "./governance-setup-guide-steps";

type GovernanceSetupGuideProgressSummaryProps = {
  readonly summary: GovernanceSetupProgressSummary;
};

export function GovernanceSetupGuideProgressSummary({ summary }: GovernanceSetupGuideProgressSummaryProps) {
  const progressPercent = Math.round(summary.progressFraction * 100);

  return (
    <div
      className="space-y-2"
      data-testid="governance-setup-progress-summary"
      aria-live="polite"
    >
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {summary.completedCount} of {summary.totalCount} completed
        </span>
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-label="Governance setup progress"
        className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
      >
        <div
          className="h-full rounded-full bg-teal-700 transition-[width] duration-300 dark:bg-teal-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
