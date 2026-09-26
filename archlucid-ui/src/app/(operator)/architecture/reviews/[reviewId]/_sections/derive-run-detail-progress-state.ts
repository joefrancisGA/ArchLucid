import { runAnalysisComplete } from "@/lib/run-detail-workspace-derive/internal";
import type { RunDetail, RunSummary } from "@/types/authority";

import { pipelineCompleteOnSummary } from "./pipeline-complete-on-summary";

export function deriveRunDetailProgressState(
  run: RunDetail["run"],
  manifestId: string | undefined | null,
  progressForPipelineUi: RunSummary,
): { readonly runCompleted: boolean; readonly showProgressTracker: boolean } {
  const runCompleted = runAnalysisComplete(run);
  const showProgressTracker =
    !runCompleted
    && (!manifestId || !pipelineCompleteOnSummary(progressForPipelineUi));

  return { runCompleted, showProgressTracker };
}
