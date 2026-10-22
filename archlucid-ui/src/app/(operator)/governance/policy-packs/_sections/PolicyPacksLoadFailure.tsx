import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { POLICY_PACKS_LOAD_RETRY_LABEL } from "./policy-packs-page-copy";

export type PolicyPacksLoadFailureProps = {
  readonly message: string;
  readonly retrying: boolean;
  readonly onRetry: () => void;
};

/** Single policy packs hub load failure with retry (GPP). */
export function PolicyPacksLoadFailure(props: PolicyPacksLoadFailureProps): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="policy-packs-load-failure">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
        {props.message}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={props.retrying}
        data-testid="policy-packs-load-retry"
        onClick={props.onRetry}
      >
        {POLICY_PACKS_LOAD_RETRY_LABEL}
      </Button>
    </div>
  );
}
