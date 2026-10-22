import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { ARCHITECTURE_DRAFT_DETAIL_LOAD_RETRY_LABEL } from "@/lib/architecture/architecture-draft-detail-page-copy";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureDraftDetailLoadFailureProps = {
  readonly message: string;
  readonly onRetry: () => void;
};

/** Single draft-detail load failure with TB-2155 recovery contract (AD-11). */
export function ArchitectureDraftDetailLoadFailure(
  props: ArchitectureDraftDetailLoadFailureProps,
): React.JSX.Element {
  const presentation = errorRecoveryContractForScenario("architecture-draft-load", {
    failureSummary: props.message,
  });

  return (
    <div className="space-y-3" data-testid="architecture-draft-detail-load-failure">
      <OperatorErrorRecoveryContract
        testId="architecture-draft-detail-load-recovery"
        presentation={presentation}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="architecture-draft-detail-load-retry"
          onClick={props.onRetry}
        >
          {ARCHITECTURE_DRAFT_DETAIL_LOAD_RETRY_LABEL}
        </Button>
        <Link href={ARCHITECTURES_LIST_PATH} className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}>
          Back to architectures list
        </Link>
      </div>
    </div>
  );
}
