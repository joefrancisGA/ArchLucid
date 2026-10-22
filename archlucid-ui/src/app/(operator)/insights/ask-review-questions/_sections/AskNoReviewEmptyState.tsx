"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { buildInsightsFinalizedReviewPrerequisiteEmpty } from "@/lib/insights-finalized-review-prerequisite-empty";

/** Focused Ask page empty state when no reviews are available to scope questions. */
export function AskNoReviewEmptyState() {
  const { isWorkingMode } = useWorkspaceMode();
  const preset = buildInsightsFinalizedReviewPrerequisiteEmpty({
    jobId: "ask",
    finalizedCount: 0,
    workingMode: isWorkingMode,
  });

  return <EnterpriseCompactEmptyState {...preset} />;
}
