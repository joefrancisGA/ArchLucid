"use client";

import { useCallback, useEffect, useState } from "react";

import { normalizeRunIdForRecurrenceApi } from "@/components/RunDetailRecurrenceScheduleCard";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusTag } from "@/components/ui/status-tag";
import {
  createArchitectureReviewRecurrenceSchedule,
  listArchitectureReviewRecurrenceSchedules,
  type ArchitectureReviewRecurrenceSchedule,
} from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const DEFAULT_CRON = "0 8 * * 1";
const DEFAULT_NAME = "Weekly architecture review";

function formatNextRunUtc(nextRunUtc: string | null | undefined): string {
  if (!nextRunUtc) {
    return "Pending schedule calculation";
  }

  const parsed = new Date(nextRunUtc);

  if (Number.isNaN(parsed.getTime())) {
    return nextRunUtc;
  }

  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

type RecurrenceSchedulePostCommitCardProps = {
  readonly runId: string;
  readonly hasStickinessPrompt?: boolean;
};

/** TB-222 — post-commit recurrence scheduling with cron + display name. */
export function RecurrenceSchedulePostCommitCard({
  runId,
  hasStickinessPrompt = false,
}: RecurrenceSchedulePostCommitCardProps) {
  const [open, setOpen] = useState(hasStickinessPrompt);
  const [schedules, setSchedules] = useState<ArchitectureReviewRecurrenceSchedule[]>([]);
  const [name, setName] = useState(DEFAULT_NAME);
  const [cronExpression, setCronExpression] = useState(DEFAULT_CRON);
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

  async function submitSchedule(): Promise<void> {
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
        name: name.trim() || DEFAULT_NAME,
        cronExpression: cronExpression.trim() || DEFAULT_CRON,
        isEnabled: true,
      });

      setStatusMessage("Recurrence scheduled.");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create recurrence schedule.");
    } finally {
      setBusy(false);
    }
  }

  const existing = schedules[0] ?? null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="recurrence-schedule-post-commit-card"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-4 text-left">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Schedule next review</h3>
        <span className="text-xs text-neutral-600 dark:text-neutral-400">{open ? "Hide" : "Show"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-neutral-200 px-4 pb-4 pt-3 dark:border-neutral-700">
        <p className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.body)}>
          Clone this committed review on a schedule so governance does not depend on operator memory.
        </p>
        {existing ? (
          <div className="space-y-2">
            <StatusTag kind="ready" label="Scheduled" />
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>
              {existing.name} — {existing.cronExpression}
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>Next run: {formatNextRunUtc(existing.nextRunUtc)}</p>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitSchedule();
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className={OPERATOR_TYPOGRAPHY.label}>Display name</span>
              <input
                className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="recurrence-schedule-name"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className={OPERATOR_TYPOGRAPHY.label}>Cron expression (UTC)</span>
              <input
                className="rounded border border-neutral-300 bg-white px-2 py-1 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                data-testid="recurrence-schedule-cron"
              />
            </label>
            {statusMessage ? <p className="m-0 text-sm text-teal-800 dark:text-teal-300">{statusMessage}</p> : null}
            {errorMessage ? <p className="m-0 text-sm text-red-700 dark:text-red-400">{errorMessage}</p> : null}
            <Button
              type="submit"
              size="sm"
              disabled={busy || normalizedRunId === null}
              data-testid="recurrence-schedule-submit"
            >
              {busy ? "Scheduling…" : "Schedule recurrence"}
            </Button>
          </form>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
