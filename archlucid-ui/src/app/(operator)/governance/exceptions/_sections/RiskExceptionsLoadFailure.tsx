import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { RISK_EXCEPTIONS_LOAD_RETRY_LABEL } from "../risk-exceptions-page-copy";

export type RiskExceptionsLoadFailureProps = {
  readonly message: string;
  readonly retrying: boolean;
  readonly onRetry: () => void;
};

/** Single exceptions register load failure with retry (GRO). */
export function RiskExceptionsLoadFailure(props: RiskExceptionsLoadFailureProps): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="risk-exceptions-load-failure">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
        {props.message}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={props.retrying}
        data-testid="risk-exceptions-load-retry"
        onClick={props.onRetry}
      >
        {RISK_EXCEPTIONS_LOAD_RETRY_LABEL}
      </Button>
    </div>
  );
}
