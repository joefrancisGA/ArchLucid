import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  REVIEW_WORKSPACE_LIFECYCLE_PROGRESS_STEPS,
  resolveReviewWorkspaceLifecycleProgressStep,
} from "@/lib/reviews/review-workspace-lifecycle-progress-copy";
import { cn } from "@/lib/utils";

export type ReviewWorkspaceLifecycleProgressStepperProps = {
  readonly lifecycle: ReviewWorkspaceLifecycle;
  readonly reviewIsSealed?: boolean;
};

export function ReviewWorkspaceLifecycleProgressStepper(
  props: ReviewWorkspaceLifecycleProgressStepperProps,
): React.JSX.Element | null {
  if (props.reviewIsSealed === true) {
    return null;
  }

  const currentId = resolveReviewWorkspaceLifecycleProgressStep(props.lifecycle);
  const currentIndex = REVIEW_WORKSPACE_LIFECYCLE_PROGRESS_STEPS.findIndex((step) => step.id === currentId);

  return (
    <section
      aria-label="Review lifecycle progress"
      data-testid="review-workspace-lifecycle-progress-stepper"
      className="space-y-1"
    >
      <ol className="m-0 grid list-none grid-cols-4 gap-1 p-0">
        {REVIEW_WORKSPACE_LIFECYCLE_PROGRESS_STEPS.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "border-t-2 pt-1 text-center",
              index < currentIndex
                ? "border-al-accent-interactive text-al-text-primary"
                : index === currentIndex
                  ? "border-al-accent-interactive font-semibold text-al-text-primary"
                  : "border-border text-al-text-secondary",
              OPERATOR_TYPOGRAPHY.micro,
            )}
            data-current={index === currentIndex ? "true" : undefined}
          >
            {step.label}
          </li>
        ))}
      </ol>
    </section>
  );
}
