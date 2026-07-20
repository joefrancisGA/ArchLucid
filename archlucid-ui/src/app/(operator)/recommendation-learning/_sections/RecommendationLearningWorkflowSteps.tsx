import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const WORKFLOW_STEPS = [
  "Reviews",
  "Recommendation outcomes",
  "Learning history",
  "Improved recommendation ranking",
] as const;

export function RecommendationLearningWorkflowSteps(): ReactElement {
  return (
    <ol
      className="m-0 flex list-none flex-col items-stretch gap-2 p-0"
      aria-label="Recommendation learning workflow"
    >
      {WORKFLOW_STEPS.map((step, index) => (
        <li key={step} className="flex flex-col items-center gap-2">
          <div
            className={cn(
              "w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {step}
          </div>
          {index < WORKFLOW_STEPS.length - 1 ? (
            <ArrowDown className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
