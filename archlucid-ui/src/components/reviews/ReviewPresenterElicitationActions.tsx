"use client";

import { Button } from "@/components/ui/button";
import type { UseReviewPresenterElicitationResult } from "@/hooks/use-review-presenter-elicitation";

export type ReviewPresenterElicitationActionsProps = {
  readonly elicitation: UseReviewPresenterElicitationResult;
};

/** R4 mediator loop — confirm / reject / ask another (FD-01). */
export function ReviewPresenterElicitationActions(
  props: ReviewPresenterElicitationActionsProps,
): React.JSX.Element | null {
  const { elicitation } = props;

  if (elicitation.readyToFinalize) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        data-testid="review-presenter-elicitation-confirm"
        disabled={elicitation.busy}
        onClick={() => {
          void elicitation.confirm();
        }}
      >
        Yes
      </Button>
      <Button
        type="button"
        variant="outline"
        data-testid="review-presenter-elicitation-reject"
        disabled={elicitation.busy}
        onClick={() => {
          void elicitation.reject();
        }}
      >
        No
      </Button>
      <Button
        type="button"
        variant="outline"
        data-testid="review-presenter-elicitation-another"
        disabled={elicitation.busy}
        onClick={() => {
          void elicitation.askAnother();
        }}
      >
        Another question
      </Button>
    </>
  );
}
