import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { GovernanceSetupProgressSummary } from "./governance-setup-guide-steps";

type GovernanceSetupGuideProgressSummaryProps = {
  readonly summary: GovernanceSetupProgressSummary;
};

function resolveProgressCoach(summary: GovernanceSetupProgressSummary): string {
  if (summary.isComplete) {
    return "Governance setup complete — revisit any step to refine configuration.";
  }

  if (summary.completedCount === 0 && summary.nextStepTitle !== null) {
    return `Start with “${summary.nextStepTitle}” below.`;
  }

  if (summary.nextStepTitle !== null) {
    return `Next: ${summary.nextStepTitle}`;
  }

  return "Continue the recommended step below.";
}

export function GovernanceSetupGuideProgressSummary({ summary }: GovernanceSetupGuideProgressSummaryProps) {
  const progressPercent = Math.round(summary.progressFraction * 100);
  const coach = resolveProgressCoach(summary);

  return (
    <div
      className="space-y-2"
      data-testid="governance-setup-progress-summary"
      aria-live="polite"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium text-al-text-primary">
          {summary.completedCount} of {summary.totalCount} completed
        </span>
        <span className="mx-2 text-al-text-secondary" aria-hidden>
          ·
        </span>
        <span data-testid="governance-setup-progress-coach">{coach}</span>
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
          className="h-full rounded-full bg-[var(--al-accent-interactive)] transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
