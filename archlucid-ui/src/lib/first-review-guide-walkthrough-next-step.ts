import type { FirstReviewGuideStepPresentation } from "@/lib/first-review-guide-state";

export function resolveFirstReviewGuideWalkthroughNextStep(
  steps: readonly FirstReviewGuideStepPresentation[],
): FirstReviewGuideStepPresentation | null {
  const markedNext = steps.find((step) => step.isNextStep && step.status !== "complete");

  if (markedNext !== undefined) {
    return markedNext;
  }

  return steps.find((step) => step.status !== "complete") ?? null;
}
