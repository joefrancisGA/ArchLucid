import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { buyerPipelineStageName } from "@/lib/pipeline-stage-buyer-labels";
import type { RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

function stageStarted(stage: StageTimelineSummary): boolean {
  return (stage.startedUtc ?? "").trim().length > 0;
}

function stageCompleted(stage: StageTimelineSummary): boolean {
  return (stage.completedUtc ?? "").trim().length > 0;
}

/** Returns the in-flight authority pipeline stage row, if any. */
export function resolveActivePipelineStageRow(
  timeline: readonly StageTimelineSummary[],
): StageTimelineSummary | null {
  for (const stage of timeline) {
    if (stageStarted(stage) && !stageCompleted(stage)) {
      return stage;
    }
  }

  for (const stage of timeline) {
    if (!stageStarted(stage)) {
      return stage;
    }
  }

  return null;
}

/** Infers the next coarse pipeline stage from run summary snapshot flags. */
export function inferNextPipelineStageName(summary: RunSummary | null): string | null {
  if (summary === null) {
    return "context_ingestion";
  }

  if (summary.hasContextSnapshot !== true) {
    return "context_ingestion";
  }

  if (summary.hasGraphSnapshot !== true) {
    return "graph";
  }

  if (summary.hasFindingsSnapshot !== true) {
    return "findings";
  }

  if (summary.hasGoldenManifest !== true) {
    return "artifacts";
  }

  return null;
}

/** Buyer/operator label for the stage currently executing (timeline first, summary fallback). */
export function resolveCurrentPipelineStageLabel(
  timeline: readonly StageTimelineSummary[],
  summary: RunSummary | null,
  buyerLabelsActive: boolean = isBuyerVocabularyPassActive(),
): string {
  const activeRow = resolveActivePipelineStageRow(timeline);

  if (activeRow !== null) {
    return buyerPipelineStageName(activeRow.stageName, buyerLabelsActive);
  }

  const inferredStageName = inferNextPipelineStageName(summary);

  if (inferredStageName !== null) {
    return buyerPipelineStageName(inferredStageName, buyerLabelsActive);
  }

  return buyerLabelsActive ? "Finalizing signed package" : "Review finalization";
}
