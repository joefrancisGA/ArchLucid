import type { RunDetail, ArtifactDescriptor } from "@/types/authority";

import {
  buildRunDetailClientHoursSavingsSummary,
  resolveRunSavingsUsd,
} from "@/lib/roi-resolution-priority";
import { resolveRunSavingsSummaryFromRunDetail } from "@/lib/runs/run-savings-summary-from-detail";
import { loadRunSavingsSummaryModel, type RunSavingsSummaryModel } from "@/lib/runs/run-savings-summary-model";

function splitLoadedSavingsModel(model: RunSavingsSummaryModel | null): Readonly<{
  extractorSummary: RunSavingsSummaryModel | null;
  staticDemoSummary: RunSavingsSummaryModel | null;
}> {
  if (model === null) {
    return { extractorSummary: null, staticDemoSummary: null };
  }

  if (model.sourceKind === "static-demo") {
    return { extractorSummary: null, staticDemoSummary: model };
  }

  if (model.sourceKind === "extractor-heuristic") {
    return { extractorSummary: model, staticDemoSummary: null };
  }

  return { extractorSummary: null, staticDemoSummary: null };
}

/** Resolves run-detail savings using the canonical four-tier ROI priority order. */
export async function resolveRunDetailSavingsSummary(params: Readonly<{
  resolvedDetail: RunDetail;
  usedStaticDemoRun: boolean;
  artifacts: readonly ArtifactDescriptor[];
  manifestId: string | undefined | null;
  routeRunId: string;
}>): Promise<RunSavingsSummaryModel | null> {
  const serverSummary = resolveRunSavingsSummaryFromRunDetail(params.resolvedDetail);
  const loadedModel = await loadRunSavingsSummaryModel({
    artifacts: params.artifacts,
    manifestId: params.manifestId,
    routeRunId: params.routeRunId,
    usedStaticDemoRun: params.usedStaticDemoRun,
  });
  const { extractorSummary, staticDemoSummary } = splitLoadedSavingsModel(loadedModel);
  const clientHoursSummary = buildRunDetailClientHoursSavingsSummary(params.resolvedDetail);

  return resolveRunSavingsUsd({
    serverSummary,
    extractorSummary,
    clientHoursSummary,
    staticDemoSummary,
  });
}
