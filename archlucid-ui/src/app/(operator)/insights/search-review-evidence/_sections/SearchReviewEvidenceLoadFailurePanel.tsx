import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";

export type SearchReviewEvidenceLoadFailurePanelProps = {
  readonly failure: ApiLoadFailureState;
  readonly retryLabel: string;
  readonly testId: string;
  readonly retryTestId: string;
  readonly retryDisabled?: boolean;
  readonly onRetry: () => void;
};

/** Shared search failure callout with explicit retry for `/insights/search-review-evidence`. */
export function SearchReviewEvidenceLoadFailurePanel(
  props: SearchReviewEvidenceLoadFailurePanelProps,
): React.JSX.Element {
  return (
    <div className="space-y-3" role="alert" data-testid={props.testId}>
      <OperatorApiProblem failure={props.failure} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid={props.retryTestId}
        disabled={props.retryDisabled === true}
        onClick={() => {
          props.onRetry();
        }}
      >
        {props.retryLabel}
      </Button>
    </div>
  );
}
