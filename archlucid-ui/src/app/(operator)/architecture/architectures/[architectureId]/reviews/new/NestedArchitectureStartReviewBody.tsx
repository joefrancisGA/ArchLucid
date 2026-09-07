"use client";

import { SocraticIntakeWizard } from "@/app/(operator)/architecture/reviews/new/SocraticIntakeWizard";

type NestedArchitectureStartReviewBodyProps = {
  readonly architectureId: string;
};

/** Working nested start-review intake — architecture id is in the path (AO-22). */
export function NestedArchitectureStartReviewBody(
  props: NestedArchitectureStartReviewBodyProps,
): React.JSX.Element {
  return (
    <div data-testid="nested-architecture-start-review" data-architecture-id={props.architectureId}>
      <SocraticIntakeWizard />
    </div>
  );
}
