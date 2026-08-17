import { Button } from "@/components/ui/button";
import { ARCHITECTURE_DRAFT_DETAIL_LOAD_RETRY_LABEL } from "@/lib/architecture/architecture-draft-detail-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureDraftDetailLoadFailureProps = {
  readonly message: string;
  readonly onRetry: () => void;
};

/** Single draft-detail load failure with retry (ARR). */
export function ArchitectureDraftDetailLoadFailure(
  props: ArchitectureDraftDetailLoadFailureProps,
): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="architecture-draft-detail-load-failure">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
        {props.message}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="architecture-draft-detail-load-retry"
        onClick={props.onRetry}
      >
        {ARCHITECTURE_DRAFT_DETAIL_LOAD_RETRY_LABEL}
      </Button>
    </div>
  );
}
