import { shouldMergeOperatorDemoAlertSample } from "@/lib/operator/operator-static-demo";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isLiveOperatorShellRecoveryContext } from "@/lib/live-operator-shell-recovery";
import type { RunSummary } from "@/types/authority";

/** Sentinel select value for workspace-wide Ask (TB-2200). */
export const ASK_WORKSPACE_ALL_REVIEWS_VALUE = "__workspace_all__";

export function findRunSummaryById(items: readonly RunSummary[], runId: string): RunSummary | undefined {
  const needle = runId.trim().toLowerCase();

  if (needle.length === 0) {
    return undefined;
  }

  return items.find((row) => (row.runId ?? "").trim().toLowerCase() === needle);
}

export function operatorAllowsSyntheticAskRunPick(workingMode = false): boolean {
  if (workingMode && isLiveOperatorShellRecoveryContext()) {
    return false;
  }

  return (
    isBuyerPolishedOperatorShellEnv() ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
    shouldMergeOperatorDemoAlertSample()
  );
}
