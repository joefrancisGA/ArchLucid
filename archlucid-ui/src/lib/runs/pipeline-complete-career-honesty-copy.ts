import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { RunPipelineInternalLabel } from "@/lib/pipeline-status-labels";
import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import { PIPELINE_STATUS_TOOLTIPS } from "@/lib/i18n";
import {
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  type RunStatusBadgeWorkingCareerHonestyInput,
} from "@/lib/runs/run-status-badge-career-honesty";

/** CG-033 — Working pipeline “complete” vocabulary (TB-645). Guided keeps canonical i18n strings. */
export const WORKING_PIPELINE_CAREER_COMPLETE_REVIEW_LABEL = "Review complete";

export const WORKING_PIPELINE_REHEARSAL_COMPLETE_LABEL = "Practice complete — not record-complete";

export const WORKING_PIPELINE_CAREER_BLOCKED_COMPLETE_LABEL = "Sealed record blocked — not complete";

export const WORKING_PIPELINE_REHEARSAL_PRACTICE_COMPLETE_LABEL = "Practice complete — not record-complete";

export const WORKING_PIPELINE_ENGINEERING_COMPLETE_STATUS =
  "Pipeline complete — refresh for full detail.";

export const WORKING_PIPELINE_ENGINEERING_REHEARSAL_COMPLETE_STATUS =
  "Pipeline complete — practice only. Refresh for full detail.";

export const WORKING_PIPELINE_ENGINEERING_CAREER_BLOCKED_STATUS =
  "Pipeline stopped — sealed record blocked on Simulator. Refresh for full detail.";

export const WORKING_PIPELINE_READY_TO_FINALIZE_TOOLTIP =
  "Analysis finished on a practice path. Finalize stays practice-incomplete unless structural execute is Real on the Record review type.";

export const WORKING_PIPELINE_REHEARSAL_FINALIZED_TOOLTIP =
  "A finalized review record exists, but this run is practice-incomplete — not sealed-record proof.";

export const WORKING_PIPELINE_CAREER_BLOCKED_FINALIZED_TOOLTIP =
  "A finalized review record exists on Simulator/Fallback — not a record-complete seal.";

function reviewCompleteLabelForCell(
  cellId: NonNullable<ReturnType<typeof resolveRunStatusBadgeWorkingCareerHonestyCell>>,
): string {
  if (cellId === "career-simulator-blocked") {
    return WORKING_PIPELINE_CAREER_BLOCKED_COMPLETE_LABEL;
  }

  if (cellId === "rehearsal-simulator") {
    return WORKING_PIPELINE_REHEARSAL_COMPLETE_LABEL;
  }

  if (cellId === "rehearsal-real-practice") {
    return WORKING_PIPELINE_REHEARSAL_PRACTICE_COMPLETE_LABEL;
  }

  return WORKING_PIPELINE_CAREER_COMPLETE_REVIEW_LABEL;
}

export function resolveWorkingPipelineCompleteReviewLabel(
  input: RunStatusBadgeWorkingCareerHonestyInput,
): string | null {
  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (cellId === null || cellId === "career-real") {
    return null;
  }

  return reviewCompleteLabelForCell(cellId);
}

export function resolveWorkingPipelineCompleteStatusTagKind(
  input: RunStatusBadgeWorkingCareerHonestyInput,
): EnterpriseStatusKind | null {
  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (cellId === null || cellId === "career-real") {
    return null;
  }

  if (cellId === "career-simulator-blocked") {
    return "blocked";
  }

  return "needs-attention";
}

export function resolveWorkingPipelineEngineeringCompleteStatus(
  input: RunStatusBadgeWorkingCareerHonestyInput,
): string | null {
  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (cellId === null || cellId === "career-real") {
    return null;
  }

  if (cellId === "career-simulator-blocked") {
    return WORKING_PIPELINE_ENGINEERING_CAREER_BLOCKED_STATUS;
  }

  return WORKING_PIPELINE_ENGINEERING_REHEARSAL_COMPLETE_STATUS;
}

export function resolvePipelineStatusTooltip(
  internalLabel: RunPipelineInternalLabel,
  input: RunStatusBadgeWorkingCareerHonestyInput,
): string {
  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(input);

  if (input.workingDesk === true && cellId !== null && cellId !== "career-real") {
    if (internalLabel === PIPELINE_STATUS_LABELS.readyToFinalize) {
      return WORKING_PIPELINE_READY_TO_FINALIZE_TOOLTIP;
    }

    if (internalLabel === PIPELINE_STATUS_LABELS.finalized) {
      if (cellId === "career-simulator-blocked") {
        return WORKING_PIPELINE_CAREER_BLOCKED_FINALIZED_TOOLTIP;
      }

      return WORKING_PIPELINE_REHEARSAL_FINALIZED_TOOLTIP;
    }
  }

  switch (internalLabel) {
    case PIPELINE_STATUS_LABELS.finalized:
      return PIPELINE_STATUS_TOOLTIPS.finalized;
    case PIPELINE_STATUS_LABELS.readyToFinalize:
      return PIPELINE_STATUS_TOOLTIPS.readyToFinalize;
    case PIPELINE_STATUS_LABELS.inPipeline:
      return PIPELINE_STATUS_TOOLTIPS.inPipeline;
    case PIPELINE_STATUS_LABELS.starting:
      return PIPELINE_STATUS_TOOLTIPS.starting;
    default:
      return internalLabel;
  }
}
