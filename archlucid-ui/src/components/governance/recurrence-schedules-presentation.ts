import type { ArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";

export function truncateRunId(runId: string): string {
  const normalized = runId.replace(/-/g, "");

  if (normalized.length <= 12) {
    return runId;
  }

  return `${normalized.slice(0, 8)}…${normalized.slice(-4)}`;
}

export const RECURRENCE_SCHEDULE_REVIEW_PACKAGE_LINK_LABEL = "Open review";

export type RecurrenceStatusPresentation = {
  kind: "ready" | "needs-attention" | "danger" | "muted";
  label: string;
  title?: string;
};

export function recurrenceRunStatusPresentation(
  schedule: ArchitectureReviewRecurrenceSchedule,
): RecurrenceStatusPresentation {
  const lastStatus = schedule.lastRunStatus?.trim().toLowerCase() ?? "never";
  const failuresRaw = schedule.consecutiveFailureCount;
  const failuresKnown = typeof failuresRaw === "number" && Number.isFinite(failuresRaw);
  const failures = failuresKnown ? Math.max(0, Math.trunc(failuresRaw)) : 0;

  if (!schedule.isEnabled && failuresKnown && failures >= 5) {
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
      label:
        failuresKnown && failures > 0
          ? `Failed (${failures})`
          : failuresKnown
            ? "Failed"
            : "Failed",
      title:
        failuresKnown
          ? schedule.lastErrorMessage ?? undefined
          : "Failure count not returned",
    };
  }

  if (lastStatus === "succeeded") {
    return { kind: "ready", label: "Last run OK" };
  }

  return { kind: "muted", label: "Never run" };
}

export function scheduleStatusKind(
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

export function statusTagKind(
  runStatus: RecurrenceStatusPresentation,
  statusKind: "ready" | "needs-attention",
): "ready" | "needs-attention" {
  if (runStatus.kind === "ready") {
    return "ready";
  }

  if (runStatus.kind === "danger" || runStatus.kind === "muted") {
    return "needs-attention";
  }

  return statusKind === "ready" ? "ready" : "needs-attention";
}

export function recurrenceSchedulesLoadFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to load recurrence schedules.";
}
