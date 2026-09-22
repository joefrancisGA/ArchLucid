import {
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL,
  type RunStatusBadgeWorkingCareerHonestyCellId,
  type RunStatusBadgeWorkingCareerHonestyInput,
} from "@/lib/runs/run-status-badge-career-honesty";

/** CG-036 — inbox chip when alert sourcing run is not Career + Real. */
export const ALERT_INBOX_REHEARSAL_TITLE_PREFIX = "Rehearsal — ";

export type AlertInboxCareerHonestyPresentation = {
  readonly cellId: RunStatusBadgeWorkingCareerHonestyCellId;
  readonly chipLabel: string;
};

function chipLabelForCell(cellId: RunStatusBadgeWorkingCareerHonestyCellId): string {
  if (cellId === "career-simulator-blocked") {
    return RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL;
  }

  if (cellId === "rehearsal-simulator") {
    return RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL;
  }

  return RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL;
}

export function resolveAlertInboxCareerHonesty(
  input: RunStatusBadgeWorkingCareerHonestyInput & {
    readonly isSample?: boolean | null;
  },
): AlertInboxCareerHonestyPresentation | null {
  if (input.isSample === true) {
    return null;
  }

  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (cellId === null || cellId === "career-real") {
    return null;
  }

  return {
    cellId,
    chipLabel: chipLabelForCell(cellId),
  };
}

export function alertTitleShowsRehearsalHonesty(title: string): boolean {
  return title.trimStart().startsWith(ALERT_INBOX_REHEARSAL_TITLE_PREFIX);
}
