import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";

export type OperatorErrorRecoveryContractProps = {
  readonly presentation: ErrorRecoveryContractPresentation;
  readonly testId?: string;
  readonly className?: string;
};

/** Three-part operator error recovery block — what failed, what's intact, next step (TB-2155). */
export function OperatorErrorRecoveryContract(
  props: OperatorErrorRecoveryContractProps,
): React.JSX.Element {
  const { presentation, testId = "operator-error-recovery-contract", className } = props;

  return (
    <div
      className={cn(
        "mt-3 space-y-1 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100",
        OPERATOR_TYPOGRAPHY.helper,
        className,
      )}
      data-testid={testId}
    >
      <p className="m-0" data-testid="operator-error-recovery-what-failed">
        <span className="font-semibold text-neutral-900 dark:text-neutral-50">What failed:</span>{" "}
        {presentation.whatFailed}
      </p>
      <p className="m-0" data-testid="operator-error-recovery-intact">
        <span className="font-semibold text-neutral-900 dark:text-neutral-50">What&apos;s intact:</span>{" "}
        {presentation.whatIsIntact}
      </p>
      <p className="m-0" data-testid="operator-error-recovery-next-step">
        <span className="font-semibold text-neutral-900 dark:text-neutral-50">Next step:</span>{" "}
        {presentation.nextStep}
      </p>
    </div>
  );
}
