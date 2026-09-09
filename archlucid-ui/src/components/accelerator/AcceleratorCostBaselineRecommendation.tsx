import { ACCELERATOR_COST_BASELINE_RECOMMENDATION } from "@/lib/accelerator-chooser-pack-prerequisite";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type AcceleratorCostBaselineRecommendationProps = {
  readonly className?: string;
  readonly testId?: string;
};

/** Soft recommendation for cost-policy packs — not a tenant gate. */
export function AcceleratorCostBaselineRecommendation(
  props: AcceleratorCostBaselineRecommendationProps,
): React.ReactElement {
  return (
    <p
      className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid={props.testId}
    >
      {ACCELERATOR_COST_BASELINE_RECOMMENDATION}
    </p>
  );
}
