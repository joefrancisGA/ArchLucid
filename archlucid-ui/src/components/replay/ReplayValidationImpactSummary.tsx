"use client";

import { cn } from "@/lib/utils";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REPLAY_AI_BUDGET_VARIANCE_NOTE } from "@/lib/replay-validation-copy";
import { replayValidationModeDefinition } from "@/lib/replay-validation-workflow";

export type ReplayValidationImpactSummaryProps = {
  readonly mode: string;
};

export function ReplayValidationImpactSummary(props: ReplayValidationImpactSummaryProps) {
  const definition = replayValidationModeDefinition(props.mode);

  return (
    <section
      aria-label="Selected validation impact"
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="replay-validation-impact-summary"
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Selected operation</h3>
      <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Mode</dt>
          <dd className="m-0">{definition.title}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>AI usage</dt>
          <dd className="m-0" data-testid="replay-validation-ai-usage">
            {definition.aiUsageLabel}
          </dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Estimated duration</dt>
          <dd className="m-0">{definition.estimatedDurationLabel}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Behavior</dt>
          <dd className="m-0">{definition.mutabilityLabel}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Stored output</dt>
          <dd className="m-0">{definition.storedOutputLabel}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Record created</dt>
          <dd className="m-0">{definition.recordLabel}</dd>
        </div>
      </dl>
      {definition.aiUsage !== "none" ? (
        <p
          className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)}
          data-testid="replay-validation-ai-budget-disclosure"
        >
          {REPLAY_AI_BUDGET_VARIANCE_NOTE}
        </p>
      ) : (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="replay-validation-read-only-note">
          Read-only — does not alter stored outputs or consume full-review AI budget.
        </p>
      )}
    </section>
  );
}
