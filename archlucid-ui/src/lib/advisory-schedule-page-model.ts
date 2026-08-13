import {
  ADVISORY_SCANS_SCHEDULES_EXAMPLE_NAME,
} from "@/lib/advisory-copy";
import {
  describeStoredCronExpression,
  formatAdvisoryScheduleInstant,
  resolveBrowserTimeZoneId,
} from "@/lib/advisory-schedule-form";
import type { AdvisoryScanExecution, AdvisoryScanSchedule } from "@/types/advisory-scheduling";

export type AdvisoryScheduleListItemView = {
  readonly scheduleId: string;
  readonly name: string;
  readonly projectLabel: string;
  readonly frequencyLabel: string;
  readonly timeZoneLabel: string;
  readonly nextRunPrimary: string;
  readonly nextRunUtcSecondary: string;
  readonly lastRunPrimary: string;
  readonly lastOutcome: string;
  readonly statusKind: "ready" | "draft";
  readonly statusLabel: "Active" | "Paused";
  readonly isEnabled: boolean;
  readonly cronExpression: string;
};

export function resolveCurrentProjectLabel(
  projectLabel: string | null | undefined,
  fallback = "Current project",
): string {
  const trimmed = projectLabel?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : fallback;
}

export function buildAdvisoryScheduleListItemView(
  schedule: AdvisoryScanSchedule,
  displayTimeZoneId: string = resolveBrowserTimeZoneId(),
  projectLabelOverride?: string,
): AdvisoryScheduleListItemView {
  const next = schedule.nextRunUtc
    ? formatAdvisoryScheduleInstant(schedule.nextRunUtc, displayTimeZoneId)
    : { primary: "—", utcSecondary: "" };
  const last = schedule.lastRunUtc
    ? formatAdvisoryScheduleInstant(schedule.lastRunUtc, displayTimeZoneId)
    : { primary: "—", utcSecondary: "" };
  const projectLabel =
    projectLabelOverride?.trim() ||
    (schedule.runProjectSlug === "default" ? "Current project" : schedule.runProjectSlug);

  return {
    scheduleId: schedule.scheduleId,
    name: schedule.name.trim().length > 0 ? schedule.name : "Advisory scan schedule",
    projectLabel,
    frequencyLabel: describeStoredCronExpression(schedule.cronExpression),
    timeZoneLabel: "Stored as UTC schedule",
    nextRunPrimary: next.primary,
    nextRunUtcSecondary: next.utcSecondary,
    lastRunPrimary: last.primary,
    lastOutcome: "—",
    statusKind: schedule.isEnabled ? "ready" : "draft",
    statusLabel: schedule.isEnabled ? "Active" : "Paused",
    isEnabled: schedule.isEnabled,
    cronExpression: schedule.cronExpression,
  };
}

export function summarizeExecutionOutcome(execution: AdvisoryScanExecution | undefined): string {
  if (execution === undefined) {
    return "—";
  }

  const status = execution.status.trim();

  if (status.length === 0) {
    return "—";
  }

  if (execution.errorMessage && execution.errorMessage.trim().length > 0) {
    return `${status}: ${execution.errorMessage.trim()}`;
  }

  return status;
}

export function withLatestExecutionOutcome(
  view: AdvisoryScheduleListItemView,
  executions: readonly AdvisoryScanExecution[] | undefined,
): AdvisoryScheduleListItemView {
  const latest = executions?.[0];

  return {
    ...view,
    lastOutcome: summarizeExecutionOutcome(latest),
  };
}

/** Static example row for empty schedules tab — not backed by API data. */
export function buildAdvisoryScheduleExamplePreviewView(
  projectLabel: string,
  displayTimeZoneId: string = resolveBrowserTimeZoneId(),
): AdvisoryScheduleListItemView {
  const next = formatAdvisoryScheduleInstant("2026-07-27T08:00:00.000Z", displayTimeZoneId);
  const last = formatAdvisoryScheduleInstant("2026-07-20T08:00:00.000Z", displayTimeZoneId);
  const cronExpression = "0 8 * * 1";
  const resolvedProjectLabel = resolveCurrentProjectLabel(projectLabel);

  return {
    scheduleId: "example-advisory-schedule",
    name: ADVISORY_SCANS_SCHEDULES_EXAMPLE_NAME,
    projectLabel: resolvedProjectLabel,
    frequencyLabel: describeStoredCronExpression(cronExpression),
    timeZoneLabel: "Stored as UTC schedule",
    nextRunPrimary: next.primary,
    nextRunUtcSecondary: next.utcSecondary,
    lastRunPrimary: last.primary,
    lastOutcome: "Completed",
    statusKind: "ready",
    statusLabel: "Active",
    isEnabled: true,
    cronExpression,
  };
}
