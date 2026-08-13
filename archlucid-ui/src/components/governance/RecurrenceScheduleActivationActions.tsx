"use client";

import { RecurrenceScheduleActivationSummary } from "@/components/governance/RecurrenceScheduleActivationSummary";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  RECURRENCE_AI_BUDGET_DISCLOSURE,
  RECURRENCE_ENABLE_RECURRING_LABEL,
  RECURRENCE_SAVE_CHANGES_LABEL,
  RECURRENCE_SAVE_PAUSED_LABEL,
} from "@/lib/recurrence-schedule-activation-copy";
import { cn } from "@/lib/utils";

export type RecurrenceScheduleActivationActionsProps = {
  readonly cronExpression: string;
  readonly pendingIsEnabled: boolean;
  readonly mode: "create" | "edit";
  readonly disabled?: boolean;
  readonly busy?: boolean;
  readonly onSavePaused: () => void;
  readonly onEnableRecurring: () => void;
  readonly onSaveChanges?: () => void;
};

/** Explicit activation controls with AI-budget disclosure before enabling recurring assessments. */
export function RecurrenceScheduleActivationActions(props: RecurrenceScheduleActivationActionsProps) {
  const {
    cronExpression,
    pendingIsEnabled,
    mode,
    disabled = false,
    busy = false,
    onSavePaused,
    onEnableRecurring,
    onSaveChanges,
  } = props;

  const controlsDisabled = disabled || busy;
  const showSaveChanges = mode === "edit" && onSaveChanges !== undefined;

  return (
    <div className="space-y-3" data-testid="recurrence-activation-actions">
      <RecurrenceScheduleActivationSummary cronExpression={cronExpression} isActive={pendingIsEnabled} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={controlsDisabled}
            onClick={onSavePaused}
            data-testid="recurrence-save-paused"
          >
            {busy ? "Saving…" : RECURRENCE_SAVE_PAUSED_LABEL}
          </Button>

          {showSaveChanges ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={controlsDisabled}
              onClick={onSaveChanges}
              data-testid="recurrence-save-changes"
            >
              {busy ? "Saving…" : RECURRENCE_SAVE_CHANGES_LABEL}
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <p
            className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)}
            data-testid="recurrence-ai-budget-disclosure"
          >
            {RECURRENCE_AI_BUDGET_DISCLOSURE}
          </p>
          <Button
            type="button"
            size="sm"
            disabled={controlsDisabled}
            onClick={onEnableRecurring}
            data-testid="recurrence-enable-recurring"
          >
            {busy ? "Saving…" : RECURRENCE_ENABLE_RECURRING_LABEL}
          </Button>
        </div>
      </div>
    </div>
  );
}
