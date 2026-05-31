"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  createArchitectureReviewRecurrenceSchedule,
  listArchitectureReviewRecurrenceSchedules,
  type ArchitectureReviewRecurrenceSchedule,
} from "@/lib/api/governance-stickiness-api";

/** Normalizes authority run ids (hex or hyphenated GUID) for recurrence API bodies. */
export function normalizeRunIdForRecurrenceApi(runId: string): string | null {
  const trimmed = runId.trim();

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const hex = trimmed.replace(/-/g, "");

  if (hex.length !== 32 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase();
}

type RunDetailRecurrenceScheduleCardProps = {
  readonly runId: string;
};

/** TB-062 — schedule automated follow-up reviews from a committed source run. */
export function RunDetailRecurrenceScheduleCard({ runId }: RunDetailRecurrenceScheduleCardProps) {
  const [schedules, setSchedules] = useState<ArchitectureReviewRecurrenceSchedule[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const normalizedRunId = normalizeRunIdForRecurrenceApi(runId);

  const reload = useCallback(async (): Promise<void> => {
    const rows = await listArchitectureReviewRecurrenceSchedules();
    setSchedules(
      normalizedRunId === null
        ? []
        : rows.filter((row) => row.sourceRunId.replace(/-/g, "").toLowerCase() === normalizedRunId.replace(/-/g, "")),
    );
  }, [normalizedRunId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) {
          setErrorMessage("Recurrence schedules could not be loaded.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function enableWeeklySchedule(): Promise<void> {
    if (normalizedRunId === null) {
      setErrorMessage("Run id is not a valid GUID for recurrence scheduling.");

      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await createArchitectureReviewRecurrenceSchedule({
        sourceRunId: normalizedRunId,
        name: "Weekly architecture review",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
      });

      setStatusMessage("Weekly recurrence enabled (Mondays 08:00 UTC).");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create recurrence schedule.");
    } finally {
      setBusy(false);
    }
  }

  const existing = schedules[0] ?? null;

  return (
    <section
      aria-label="Automated follow-up review"
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="run-detail-recurrence-schedule"
    >
      <h3 className="m-0 mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Automated follow-up review
      </h3>
      <p className="m-0 mb-3 text-sm text-neutral-700 dark:text-neutral-300">
        Clone this committed review on a schedule so governance does not depend on operator memory.
      </p>
      {statusMessage ? <p className="m-0 mb-2 text-sm text-teal-800 dark:text-teal-300">{statusMessage}</p> : null}
      {errorMessage ? <p className="m-0 mb-2 text-sm text-red-700 dark:text-red-400">{errorMessage}</p> : null}
      {existing ? (
        <ul className="m-0 list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
          <li>
            {existing.name} — {existing.cronExpression}
            {existing.isEnabled ? "" : " (disabled)"}
          </li>
          {existing.nextRunUtc ? <li>Next run: {existing.nextRunUtc}</li> : null}
          {existing.lastTriggeredUtc ? <li>Last triggered: {existing.lastTriggeredUtc}</li> : null}
        </ul>
      ) : (
        <Button type="button" size="sm" disabled={busy || normalizedRunId === null} onClick={() => void enableWeeklySchedule()}>
          Enable weekly recurrence
        </Button>
      )}
    </section>
  );
}
