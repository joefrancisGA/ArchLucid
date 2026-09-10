"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { buildWorkingInsightsArchitectureBindEmpty } from "@/lib/architecture/working-insights-architecture-bind-empty";
import type { ResolveOpenArchitectureJobRunIdResult } from "@/lib/architecture/resolve-open-architecture-job-run-id";
import type { WorkingInsightsBindTool } from "@/lib/architecture/working-insights-architecture-bind-empty";

export type WorkingInsightsArchitectureBindEmptyStateProps = {
  readonly bindResult: ResolveOpenArchitectureJobRunIdResult;
  readonly tool: WorkingInsightsBindTool;
};

/** Working insights empty state when the open architecture has no current review job. */
export function WorkingInsightsArchitectureBindEmptyState(
  props: WorkingInsightsArchitectureBindEmptyStateProps,
): React.JSX.Element {
  const preset = buildWorkingInsightsArchitectureBindEmpty(props.bindResult, props.tool);

  return <EnterpriseCompactEmptyState {...preset} />;
}
