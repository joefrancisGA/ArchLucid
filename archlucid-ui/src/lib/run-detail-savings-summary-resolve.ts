import type { RunDetail, ArtifactDescriptor } from "@/types/authority";

import { resolveRunSavingsSummaryFromRunDetail } from "./run-savings-summary-from-detail";
import { loadRunSavingsSummaryModel, type RunSavingsSummaryModel } from "./run-savings-summary-model";

/** Resolves run-detail savings: server-authoritative first; demo-only artifact heuristics when flagged. */
export async function resolveRunDetailSavingsSummary(params: Readonly<{
  resolvedDetail: RunDetail;
  usedStaticDemoRun: boolean;
  artifacts: readonly ArtifactDescriptor[];
  manifestId: string | undefined | null;
  routeRunId: string;
}>): Promise<RunSavingsSummaryModel | null> {
  const fromServer = resolveRunSavingsSummaryFromRunDetail(params.resolvedDetail);

  if (fromServer !== null) {
    return fromServer;
  }

  if (!params.usedStaticDemoRun) {
    return null;
  }

  return loadRunSavingsSummaryModel({
    artifacts: params.artifacts,
    manifestId: params.manifestId,
    routeRunId: params.routeRunId,
    usedStaticDemoRun: params.usedStaticDemoRun,
  });
}
