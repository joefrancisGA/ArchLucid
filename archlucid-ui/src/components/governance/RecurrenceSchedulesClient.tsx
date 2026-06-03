"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import {
  listArchitectureReviewRecurrenceSchedules,
  updateArchitectureReviewRecurrenceSchedule,
  type ArchitectureReviewRecurrenceSchedule,
} from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function truncateRunId(runId: string): string {
  const normalized = runId.replace(/-/g, "");

  if (normalized.length <= 12) {
    return runId;
  }

  return `${normalized.slice(0, 8)}…${normalized.slice(-4)}`;
}

type RecurrenceStatusPresentation = {
  kind: "ready" | "needs-attention" | "danger" | "muted";
  label: string;
  title?: string;
};

function recurrenceRunStatusPresentation(
  schedule: ArchitectureReviewRecurrenceSchedule,
): RecurrenceStatusPresentation {
  const lastStatus = schedule.lastRunStatus?.trim().toLowerCase() ?? "never";
  const failures = schedule.consecutiveFailureCount ?? 0;

  if (!schedule.isEnabled && failures >= 5) {
    return {
      kind: "danger",
      label: "Auto-disabled",
      title:
        schedule.lastErrorMessage ??
        "Auto-disabled after repeated failures — re-enable when the source run is healthy.",
    };
  }

  if (lastStatus === "failed") {
    return {
      kind: "danger",
      label: failures > 0 ? `Failed (${failures})` : "Failed",
      title: schedule.lastErrorMessage ?? undefined,
    };
  }

  if (lastStatus === "succeeded") {
    return { kind: "ready", label: "Last run OK" };
  }

  return { kind: "muted", label: "Never run" };
}

function scheduleStatusKind(
  schedule: ArchitectureReviewRecurrenceSchedule,
): "ready" | "needs-attention" {
  const runStatus = recurrenceRunStatusPresentation(schedule);

  if (runStatus.kind === "danger") {
    return "needs-attention";
  }

  if (!schedule.isEnabled) {
    return "needs-attention";
  }

  if (!schedule.nextRunUtc) {
    return "needs-attention";
  }

  const next = new Date(schedule.nextRunUtc);

  if (Number.isNaN(next.getTime())) {
    return "needs-attention";
  }

  if (next.getTime() < Date.now()) {
    return "needs-attention";
  }

  return "ready";
}

function formatUtcLabel(utc: string | null | undefined): string {
  if (!utc) {
    return "—";
  }

  const parsed = new Date(utc);

  if (Number.isNaN(parsed.getTime())) {
    return utc;
  }

  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

/** TB-222 — list and toggle architecture review recurrence schedules. */
export default function RecurrenceSchedulesClient() {
  const [schedules, setSchedules] = useState<ArchitectureReviewRecurrenceSchedule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    const rows = await listArchitectureReviewRecurrenceSchedules();
    setSchedules(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoadError(null);

      try {
        await reload();
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load recurrence schedules.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function toggleEnabled(schedule: ArchitectureReviewRecurrenceSchedule): Promise<void> {
    setBusyId(schedule.scheduleId);
    setLoadError(null);

    try {
      await updateArchitectureReviewRecurrenceSchedule(schedule.scheduleId, {
        isEnabled: !schedule.isEnabled,
      });

      await reload();
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Failed to update schedule.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <LayerHeader pageKey="governance-workflow" />
      <OperatorPageHeader title="Recurrence schedules" />
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        Operating rhythm for automated follow-up architecture reviews. Schedules clone the source run on the cron you define.
      </p>
      {loadError ? <p className="m-0 text-sm text-red-700 dark:text-red-400">{loadError}</p> : null}
      <EnterpriseTable ariaLabel="Architecture review recurrence schedules">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Source run</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Cron (UTC)</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Next run</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Enabled</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {schedules.length === 0 ? (
            <EnterpriseTableRow>
              <EnterpriseTableCell colSpan={6}>No recurrence schedules in this scope yet.</EnterpriseTableCell>
            </EnterpriseTableRow>
          ) : (
            schedules.map((schedule) => {
              const statusKind = scheduleStatusKind(schedule);
              const runStatus = recurrenceRunStatusPresentation(schedule);
              const autoDisabled = !schedule.isEnabled && (schedule.consecutiveFailureCount ?? 0) >= 5;

              return (
                <EnterpriseTableRow key={schedule.scheduleId}>
                  <EnterpriseTableCell>{schedule.name}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <Link
                      href={`/reviews/${schedule.sourceRunId}`}
                      className="font-mono text-sm text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
                    >
                      {truncateRunId(schedule.sourceRunId)}
                    </Link>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="font-mono text-xs">{schedule.cronExpression}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatUtcLabel(schedule.nextRunUtc)}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <StatusTag
                      kind={
                        runStatus.kind === "ready"
                          ? "ready"
                          : runStatus.kind === "danger"
                            ? "needs-attention"
                            : runStatus.kind === "muted"
                              ? "needs-attention"
                              : statusKind === "ready"
                                ? "ready"
                                : "needs-attention"
                      }
                      label={runStatus.label}
                      title={runStatus.title}
                    />
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === schedule.scheduleId}
                        onClick={() => void toggleEnabled(schedule)}
                        data-testid={`recurrence-toggle-${schedule.scheduleId}`}
                      >
                        {busyId === schedule.scheduleId
                          ? "Saving…"
                          : schedule.isEnabled
                            ? "Disable"
                            : "Enable"}
                      </Button>
                      {autoDisabled ? (
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          Auto-disabled after repeated failures — re-enable when ready.
                        </span>
                      ) : null}
                    </div>
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              );
            })
          )}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
