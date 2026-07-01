"use client";

import { useState } from "react";

import { normalizeRunIdForRecurrenceApi } from "@/components/RunDetailRecurrenceScheduleCard";
import { RecurrenceScheduleFormFields } from "@/components/governance/RecurrenceScheduleFormFields";
import { Button } from "@/components/ui/button";
import { createArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const DEFAULT_CRON = "0 8 * * 1";
const DEFAULT_NAME = "Quarterly control validation";

export type RecurrenceScheduleCreatePanelProps = {
  readonly onCreated: () => Promise<void>;
  readonly onCancel?: () => void;
};

/** Inline create panel wired to the governance recurrence schedule API. */
export function RecurrenceScheduleCreatePanel(props: RecurrenceScheduleCreatePanelProps) {
  const { onCreated, onCancel } = props;
  const [sourceRunId, setSourceRunId] = useState("");
  const [name, setName] = useState(DEFAULT_NAME);
  const [cronExpression, setCronExpression] = useState(DEFAULT_CRON);
  const [isEnabled, setIsEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submitCreate(): Promise<void> {
    const normalizedRunId = normalizeRunIdForRecurrenceApi(sourceRunId);

    if (normalizedRunId === null) {
      setErrorMessage("Enter a valid committed review package GUID.");

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
      setIsEnabled(true);
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
        Choose a committed review package, then define the cadence for automated follow-up reviews.
      </p>

      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitCreate();
        }}
      >
        <RecurrenceScheduleFormFields
          showSourceRunId
          name={name}
          cronExpression={cronExpression}
          isEnabled={isEnabled}
          sourceRunId={sourceRunId}
          disabled={busy}
          onNameChange={setName}
          onCronExpressionChange={setCronExpression}
          onIsEnabledChange={setIsEnabled}
          onSourceRunIdChange={setSourceRunId}
        />

        {errorMessage ? (
          <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>{errorMessage}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={busy} data-testid="recurrence-schedule-create-submit">
            {busy ? "Creating…" : "Create recurrence schedule"}
          </Button>
          {onCancel !== undefined ? (
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
