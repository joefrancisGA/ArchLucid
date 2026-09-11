import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  type RunStatusBadgeWorkingCareerHonestyCellId,
  type RunStatusBadgeWorkingCareerHonestyInput,
} from "@/lib/runs/run-status-badge-career-honesty";

/** CG-032 — progress tracker copy when Working career honesty blocks a Career seal. */
export const RUN_PROGRESS_TRACKER_CAREER_BLOCKED_TERMINAL_STATUS =
  "Analysis complete — Career blocked on Simulator. Switch to Rehearsal for practice or re-execute in Real mode before a career seal.";

export const RUN_PROGRESS_TRACKER_REHEARSAL_INCOMPLETE_TERMINAL_STATUS =
  "Analysis complete — Rehearsal run on Simulator. Finalize stays rehearsal-incomplete, not career proof.";

export const RUN_PROGRESS_TRACKER_REHEARSAL_PRACTICE_TERMINAL_STATUS =
  "Analysis complete — Practice on Rehearsal door. Not career proof.";

export const RUN_PROGRESS_TRACKER_CAREER_SIGNED_RECORD_LABEL = "Finalized review record";

export const RUN_PROGRESS_TRACKER_CAREER_BLOCKED_SIGNED_RECORD_LABEL = "Career seal blocked";

export const RUN_PROGRESS_TRACKER_REHEARSAL_SIGNED_RECORD_LABEL = "Rehearsal record";

export const RUN_PROGRESS_TRACKER_CAREER_FINDINGS_LABEL = "Findings complete";

export const RUN_PROGRESS_TRACKER_REHEARSAL_FINDINGS_LABEL = "Findings ready (rehearsal)";

export const RUN_PROGRESS_TRACKER_CAREER_COMPLETE_STAGE_LABEL = "Complete";

export const RUN_PROGRESS_TRACKER_REHEARSAL_COMPLETE_STAGE_LABEL = "Rehearsal complete";

export type RunProgressTrackerCareerHonestyPresentation = {
  readonly cellId: RunStatusBadgeWorkingCareerHonestyCellId;
  readonly terminalLiveStatus: string;
  readonly signedRecordStepLabel: string;
  readonly signedRecordPendingLabel: string;
  readonly findingsStepLabel: string;
  readonly completeStageStatusLabel: string;
  readonly completeStageStatusKind: EnterpriseStatusKind;
};

function terminalLiveStatusForCell(cellId: RunStatusBadgeWorkingCareerHonestyCellId): string {
  if (cellId === "career-simulator-blocked") {
    return RUN_PROGRESS_TRACKER_CAREER_BLOCKED_TERMINAL_STATUS;
  }

  if (cellId === "rehearsal-simulator") {
    return RUN_PROGRESS_TRACKER_REHEARSAL_INCOMPLETE_TERMINAL_STATUS;
  }

  return RUN_PROGRESS_TRACKER_REHEARSAL_PRACTICE_TERMINAL_STATUS;
}

function signedRecordStepLabelForCell(cellId: RunStatusBadgeWorkingCareerHonestyCellId): string {
  if (cellId === "career-simulator-blocked") {
    return RUN_PROGRESS_TRACKER_CAREER_BLOCKED_SIGNED_RECORD_LABEL;
  }

  if (cellId === "rehearsal-simulator" || cellId === "rehearsal-real-practice") {
    return RUN_PROGRESS_TRACKER_REHEARSAL_SIGNED_RECORD_LABEL;
  }

  return RUN_PROGRESS_TRACKER_CAREER_SIGNED_RECORD_LABEL;
}

function signedRecordPendingLabelForCell(cellId: RunStatusBadgeWorkingCareerHonestyCellId): string {
  if (cellId === "career-simulator-blocked") {
    return "Career blocked";
  }

  if (cellId === "rehearsal-real-practice") {
    return "Practice";
  }

  return "Rehearsal incomplete";
}

export function resolveRunProgressTrackerCareerHonesty(
  input: RunStatusBadgeWorkingCareerHonestyInput,
): RunProgressTrackerCareerHonestyPresentation | null {
  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (cellId === null || cellId === "career-real") {
    return null;
  }

  return {
    cellId,
    terminalLiveStatus: terminalLiveStatusForCell(cellId),
    signedRecordStepLabel: signedRecordStepLabelForCell(cellId),
    signedRecordPendingLabel: signedRecordPendingLabelForCell(cellId),
    findingsStepLabel: RUN_PROGRESS_TRACKER_REHEARSAL_FINDINGS_LABEL,
    completeStageStatusLabel: RUN_PROGRESS_TRACKER_REHEARSAL_COMPLETE_STAGE_LABEL,
    completeStageStatusKind: "needs-attention",
  };
}
