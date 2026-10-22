import { cn } from "@/lib/utils";

import { StepProgressMeter } from "@/components/ui/step-progress-meter";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { GovernanceSetupProgressSummary } from "./governance-setup-guide-steps";
import {
  GOVERNANCE_SETUP_ALL_TRACKED_COMPLETE_COACH,
  formatGovernanceSetupTrackedProgressLabel,
  formatGovernanceSetupUntrackedStepsClause,
} from "./governance-setup-progress-copy";

type GovernanceSetupGuideProgressSummaryProps = {
  readonly summary: GovernanceSetupProgressSummary;
};

function resolveProgressCoach(summary: GovernanceSetupProgressSummary): string {
  if (summary.isComplete) {
    return GOVERNANCE_SETUP_ALL_TRACKED_COMPLETE_COACH;
  }

  if (summary.completedCount === 0 && summary.nextStepTitle !== null) {
    return `Start with “${summary.nextStepTitle}” below.`;
  }

  if (summary.nextStepTitle !== null) {
    return `Next: ${summary.nextStepTitle}`;
  }

  return "Continue the recommended step below.";
}

function buildProgressVisibleText(summary: GovernanceSetupProgressSummary): string {
  const trackedLabel = formatGovernanceSetupTrackedProgressLabel(
    summary.completedCount,
    summary.totalCount,
  );
  const untrackedClause = formatGovernanceSetupUntrackedStepsClause(summary.untrackedCount);
  const coach = resolveProgressCoach(summary);

  return `${trackedLabel} · ${untrackedClause} · ${coach}`;
}

export function GovernanceSetupGuideProgressSummary({ summary }: GovernanceSetupGuideProgressSummaryProps) {
  const coach = resolveProgressCoach(summary);
  const trackedLabel = formatGovernanceSetupTrackedProgressLabel(
    summary.completedCount,
    summary.totalCount,
  );
  const untrackedClause = formatGovernanceSetupUntrackedStepsClause(summary.untrackedCount);
  const ariaValueText = buildProgressVisibleText(summary);

  return (
    <div
      className="space-y-2"
      data-testid="governance-setup-progress-summary"
      aria-live="polite"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium text-al-text-primary">{trackedLabel}</span>
        <span className="mx-2 text-al-text-secondary" aria-hidden>
          ·
        </span>
        <span>{untrackedClause}</span>
        <span className="mx-2 text-al-text-secondary" aria-hidden>
          ·
        </span>
        <span data-testid="governance-setup-progress-coach">{coach}</span>
      </p>
      <StepProgressMeter
        completedCount={summary.completedCount}
        totalCount={summary.totalCount}
        label="Approval setup progress"
        valueText={ariaValueText}
        className="border border-neutral-300 dark:border-neutral-700"
      />
    </div>
  );
}
