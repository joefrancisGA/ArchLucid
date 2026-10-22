import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureIntelligenceProductContextLoadFailureProps = {
  readonly message: string;
  readonly blockedReason?: string | null;
  readonly retryLabel: string;
  readonly retryDisabled?: boolean;
  readonly onRetry: () => void;
};

/** Product run intake load failure with explicit retry (AIN). */
export function ArchitectureIntelligenceProductContextLoadFailure(
  props: ArchitectureIntelligenceProductContextLoadFailureProps,
): React.JSX.Element {
  return (
    <div className="space-y-3" role="alert" data-testid="architecture-intelligence-product-context-load-failure">
      {props.blockedReason ? (
        <p
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-intelligence-source-context-blocked-reason"
        >
          {props.blockedReason}
        </p>
      ) : null}
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="architecture-intelligence-product-context-load-retry"
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
