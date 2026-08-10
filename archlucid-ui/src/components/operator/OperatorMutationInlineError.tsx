"use client";

import { useEffect, useRef } from "react";

import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  errorRecoveryContractForScenario,
  type ErrorRecoveryContractPresentation,
  type ErrorRecoveryContractScenario,
} from "@/lib/error-recovery-contract-copy";

export type OperatorMutationInlineErrorProps = {
  readonly message: string;
  readonly testId?: string;
  readonly className?: string;
  readonly recoveryScenario?: ErrorRecoveryContractScenario;
  readonly recoveryPresentation?: ErrorRecoveryContractPresentation;
};

/** Inline error for failed high-stakes operator mutations (TB-2114 / TB-2155). */
export function OperatorMutationInlineError(props: OperatorMutationInlineErrorProps): React.ReactElement {
  const ref = useRef<HTMLParagraphElement>(null);
  const recoveryPresentation =
    props.recoveryPresentation ??
    errorRecoveryContractForScenario(props.recoveryScenario ?? "governance-mutation");

  useEffect(() => {
    ref.current?.focus();
  }, [props.message]);

  return (
    <div className={props.className} data-testid={props.testId ? `${props.testId}-wrapper` : "operator-mutation-inline-error-wrapper"}>
      <p
        ref={ref}
        tabIndex={-1}
        role="alert"
        data-testid={props.testId ?? "operator-mutation-inline-error"}
        className={cn(
          "m-0 whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100",
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        {props.message}
      </p>
      <OperatorErrorRecoveryContract presentation={recoveryPresentation} />
    </div>
  );
}
