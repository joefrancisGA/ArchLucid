import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { DECISION_REGISTER_LOAD_RETRY_LABEL } from "../decision-register-copy";

export type DecisionRegisterLoadFailureProps = {
  readonly message: string;
  readonly onRetry: () => void;
};

/** Single register load failure with retry (GDO). */
export function DecisionRegisterLoadFailure(props: DecisionRegisterLoadFailureProps): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="decision-register-load-failure">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
        {props.message}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="decision-register-load-retry"
        onClick={props.onRetry}
      >
        {DECISION_REGISTER_LOAD_RETRY_LABEL}
      </Button>
    </div>
  );
}
