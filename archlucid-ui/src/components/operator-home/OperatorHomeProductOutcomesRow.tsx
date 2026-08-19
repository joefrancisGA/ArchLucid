"use client";

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  PILOT_COMMAND_CENTER_OUTCOMES,
  PILOT_COMMAND_CENTER_OUTCOMES_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Compact payoff row for first-run home — what a completed review contains. */
export function OperatorHomeProductOutcomesRow(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (hasCommittedArchitectureReview) {
    return null;
  }

  return (
    <section
      aria-labelledby="operator-home-product-outcomes-heading"
      className="rounded-md border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="operator-home-product-outcomes"
    >
      <h3
        id="operator-home-product-outcomes-heading"
        className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}
      >
        {PILOT_COMMAND_CENTER_OUTCOMES_HEADING}
      </h3>
      <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPE_SCALE.helper)}>
        {PILOT_COMMAND_CENTER_OUTCOMES.map((outcome) => (
          <li key={outcome} className="text-al-text-secondary">
            {outcome}
          </li>
        ))}
      </ul>
    </section>
  );
}
