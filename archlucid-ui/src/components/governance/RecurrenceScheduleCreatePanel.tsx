"use client";

import { useState } from "react";

import { normalizeRunIdForRecurrenceApi } from "@/components/runs/RunDetailRecurrenceScheduleCard";
import { RecurrenceScheduleActivationActions } from "@/components/governance/RecurrenceScheduleActivationActions";
import { RecurrenceScheduleFormFields } from "@/components/governance/RecurrenceScheduleFormFields";
import { Button } from "@/components/ui/button";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { createArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const DEFAULT_CRON = "0 8 * * 1";
const DEFAULT_NAME = "Quarterly control validation";

export type RecurrenceScheduleCreatePanelProps = {
  readonly onCreated: () => Promise<void>;
  readonly onCancel?: () => void;
  /** Optional seed from a Common schedule example click (TB-1132). */
  readonly initialName?: string;
  readonly initialCronExpression?: string;
  /** Optional seed from workspace active review strip. */
  readonly initialSourceRunId?: string;
};

/** Inline create panel wired to the governance recurrence schedule API. */
export function RecurrenceScheduleCreatePanel(props: RecurrenceScheduleCreatePanelProps) {
  const { onCreated, onCancel, initialName, initialCronExpression, initialSourceRunId } = props;
  const canMutate = useOperateCapability();
  const [sourceRunId, setSourceRunId] = useState(initialSourceRunId?.trim() ?? "");
  const [name, setName] = useState(initialName?.trim() || DEFAULT_NAME);
  const [cronExpression, setCronExpression] = useState(initialCronExpression?.trim() || DEFAULT_CRON);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submitCreate(isEnabled: boolean): Promise<void> {
    if (!canMutate) {
      return;
    }

    const normalizedRunId = normalizeRunIdForRecurrenceApi(sourceRunId);

    if (normalizedRunId === null) {
      setErrorMessage("Enter a valid finalized review GUID.");

      return;
    }

    if (name.trim().length === 0) {
      setErrorMessage("Schedule name is required.");

      return;
    }

    setBusy(true);
    setErrorMessage(null);

    try {
      await createArchitectureReviewRecurrenceSchedule({
        sourceRunId: normalizedRunId,
        name: name.trim(),
        cronExpression: cronExpression.trim() || DEFAULT_CRON,
        isEnabled,
      });

      setSourceRunId("");
      setName(DEFAULT_NAME);
      setCronExpression(DEFAULT_CRON);
      await onCreated();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create recurrence schedule.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="Create recurrence schedule"
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="recurrence-schedule-create-panel"
    >
      <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Create recurrence schedule
      </h3>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Choose a finalized review, then define the cadence for automated follow-up reviews.
      </p>

      <div className="mt-4 space-y-4">
        <RecurrenceScheduleFormFields
          showSourceRunId
          name={name}
          cronExpression={cronExpression}
          sourceRunId={sourceRunId}
          disabled={busy}
          onNameChange={setName}
          onCronExpressionChange={setCronExpression}
          onSourceRunIdChange={setSourceRunId}
        />

        <RecurrenceScheduleActivationActions
          mode="create"
          cronExpression={cronExpression}
          pendingIsEnabled={false}
          disabled={!canMutate}
          busy={busy}
          onSavePaused={() => void submitCreate(false)}
          onEnableRecurring={() => void submitCreate(true)}
        />

        {errorMessage ? (
          <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>{errorMessage}</p>
        ) : null}

        {onCancel !== undefined ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </section>
  );
}
