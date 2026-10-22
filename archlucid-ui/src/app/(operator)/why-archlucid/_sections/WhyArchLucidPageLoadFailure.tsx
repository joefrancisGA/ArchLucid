import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import type { SectionError } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";

export type WhyArchLucidPageLoadFailureProps = {
  readonly error: SectionError;
  readonly retryLabel: string;
  readonly retryDisabled: boolean;
  readonly onRetry: () => void;
};

/** Single page-level telemetry load failure with retry (WH). */
export function WhyArchLucidPageLoadFailure(props: WhyArchLucidPageLoadFailureProps): React.JSX.Element {
  const { error, retryLabel, retryDisabled, onRetry } = props;

  return (
    <div className="space-y-3" data-testid="why-archlucid-page-load-failure">
      <OperatorApiProblem
        problem={error.problem}
        fallbackMessage={error.message}
        correlationId={error.correlationId}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="why-archlucid-page-load-retry"
        disabled={retryDisabled}
        onClick={onRetry}
      >
        {retryLabel}
      </Button>
    </div>
  );
}
