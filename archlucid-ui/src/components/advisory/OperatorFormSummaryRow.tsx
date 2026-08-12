import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";

export type OperatorFormSummaryRowProps = {
  readonly label: string;
  readonly value: string;
};

/** Label/value pair used in schedule and readiness summary grids. */
export function OperatorFormSummaryRow(props: OperatorFormSummaryRowProps): ReactElement {
  return (
    <div>
      <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</dt>
      <dd className={cn("m-0 mt-0.5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.value}</dd>
    </div>
  );
}
