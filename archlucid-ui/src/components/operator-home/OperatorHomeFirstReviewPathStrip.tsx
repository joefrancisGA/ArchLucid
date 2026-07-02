"use client";

import {
  OPERATOR_HOME_PILOT_FIRST_OPERATE_LATER_BODY,
  OPERATOR_HOME_PILOT_FIRST_OPERATE_LATER_HEADING,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { PilotPathPreviewStepper } from "@/components/usability/PilotPathPreviewStepper";

/** Dominant first-hour sequence on operator home — visible before the first committed review package. */
export function OperatorHomeFirstReviewPathStrip(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (hasCommittedArchitectureReview) {
    return null;
  }

  return (
    <section
      aria-labelledby="operator-home-first-review-path-heading"
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800"
      data-testid="operator-home-first-review-path-strip"
    >
      <h3
        id="operator-home-first-review-path-heading"
        className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}
      >
        {OPERATOR_HOME_PILOT_FIRST_OPERATE_LATER_HEADING}
      </h3>
      <p className={cn("m-0 mt-1 max-w-prose", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}>
        {OPERATOR_HOME_PILOT_FIRST_OPERATE_LATER_BODY}
      </p>
      <PilotPathPreviewStepper steps={PILOT_PATH_PREVIEW_STEPS} className="mt-2" />
    </section>
  );
}
