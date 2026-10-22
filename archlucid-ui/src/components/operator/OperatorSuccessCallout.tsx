"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY, DESIGN_TOKENS } from "@/lib/design-tokens";

import { DismissControl } from "@/components/usability/DismissControl";

export type OperatorSuccessCalloutProps = {
  readonly message: string;
  readonly testId?: string;
  readonly className?: string;
  readonly onDismiss?: () => void;
};

/** Durable in-page success for high-stakes operator mutations (TB-2112 / TB-2114). */
export function OperatorSuccessCallout(props: OperatorSuccessCalloutProps): React.ReactElement {
  return (
    <div
      className={cn("flex items-start justify-between gap-3", DESIGN_TOKENS.callout.success, props.className)}
      data-testid={props.testId ?? "operator-success-callout"}
      role="status"
      aria-live="polite"
    >
      <p className={cn("m-0 flex-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.message}</p>
      {props.onDismiss !== undefined ? (
        <DismissControl
          data-testid={`${props.testId ?? "operator-success-callout"}-dismiss`}
          onDismiss={props.onDismiss}
        />
      ) : null}
    </div>
  );
}
