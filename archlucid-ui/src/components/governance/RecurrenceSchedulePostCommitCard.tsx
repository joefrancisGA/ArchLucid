"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CronExpressionBuilder } from "@/components/advisory/CronExpressionBuilder";
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
import { formatRecurrenceScheduleUtcLabel } from "@/lib/recurrence-schedule-utc-format";
import { RECURRENCE_SCHEDULES_MANAGE_PATH } from "@/lib/recurrence-schedules-copy";
import { cn } from "@/lib/utils";

const DEFAULT_CRON = "0 8 * * 1";
const DEFAULT_NAME = "Weekly architecture review";

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
  const [isEnabled, setIsEnabled] = useState(true);
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
        isEnabled,
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
      id="recurrence-schedule-post-commit-card"
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="recurrence-schedule-post-commit-card"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-4 text-left">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Schedule next review</h3>
        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{open ? "Hide" : "Show"}</span>
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
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>
              Next run: {formatRecurrenceScheduleUtcLabel(existing.nextRunUtc)}
            </p>
            <Link
              href={RECURRENCE_SCHEDULES_MANAGE_PATH}
              className={cn(
                "font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="recurrence-schedule-manage-link"
            >
              Manage all recurrence schedules
            </Link>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitSchedule();
            }}
          >
            <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
              <span className={OPERATOR_TYPOGRAPHY.label}>
                Schedule name <span className="text-red-700 dark:text-red-400">*</span>
              </span>
              <input
                required
                className={cn(
                  "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="recurrence-schedule-name"
              />
            </label>
            <CronExpressionBuilder
              value={cronExpression}
              onChange={setCronExpression}
              disabled={busy}
              inputClassName={cn(
                "w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.body,
              )}
            />
            <label className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
              <input
                type="checkbox"
                checked={isEnabled}
                disabled={busy}
                onChange={(event) => setIsEnabled(event.target.checked)}
                data-testid="recurrence-schedule-enabled"
              />
              <span>
                {isEnabled
                  ? "Enabled — scheduled follow-up reviews will run automatically"
                  : "Disabled — schedule is saved but will not trigger follow-up reviews"}
              </span>
            </label>
            {statusMessage ? (
              <p className={cn("m-0 text-teal-800 dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}>{statusMessage}</p>
            ) : null}
            {errorMessage ? (
              <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>{errorMessage}</p>
            ) : null}
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
