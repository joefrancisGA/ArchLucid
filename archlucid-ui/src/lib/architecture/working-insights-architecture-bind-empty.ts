import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  architectureIdentityPath,
  startReviewFromArchitectureNestedHref,
} from "@/lib/architecture/architecture-routes";
import type { ResolveOpenArchitectureJobRunIdResult } from "@/lib/architecture/resolve-open-architecture-job-run-id";
import { WORKING_NEW_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";

export type WorkingInsightsBindTool = "ask" | "evidence-graph";

const TOOL_LABELS: Record<WorkingInsightsBindTool, string> = {
  ask: "Ask",
  "evidence-graph": "Evidence graph",
};

/** Working Ask/graph empty state when an architecture is open but has no current job (AO-30 / AO-31). */
export function buildWorkingInsightsArchitectureBindEmpty(
  bindResult: ResolveOpenArchitectureJobRunIdResult,
  tool: WorkingInsightsBindTool,
): EnterpriseCompactEmptyStateProps {
  const architectureName = bindResult.displayName.trim().length > 0
    ? bindResult.displayName.trim()
    : "this architecture";
  const toolLabel = TOOL_LABELS[tool];

  return {
    testId: `working-insights-${tool}-architecture-bind-empty`,
    title: `Open a review on ${architectureName}`,
    description: `${toolLabel} is bound to the architecture you have open. Start or resume a review on the architecture desk before asking questions or exploring the evidence graph.`,
    actions: [
      {
        label: `Open ${architectureName}`,
        href: architectureIdentityPath(bindResult.architectureId),
        variant: "primary",
      },
      {
        label: WORKING_NEW_REVIEW_LABEL,
        href: startReviewFromArchitectureNestedHref(bindResult.architectureId),
        variant: "outline",
      },
    ],
  };
}
