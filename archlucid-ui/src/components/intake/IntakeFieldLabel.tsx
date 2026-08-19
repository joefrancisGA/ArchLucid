"use client";

import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type IntakeFieldLabelProps = {
  readonly htmlFor: string;
  readonly label: string;
  readonly required: boolean;
};

/** Field label that states required/optional inline, so the operator never has to infer it. */
export function IntakeFieldLabel(props: IntakeFieldLabelProps): React.JSX.Element {
  return (
    <Label
      htmlFor={props.htmlFor}
      className="font-semibold text-neutral-900 dark:text-neutral-100"
    >
      {props.label}
      <span
        className={cn(
          "font-normal text-neutral-500 dark:text-neutral-400",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {props.required ? " (required)" : " (optional)"}
      </span>
    </Label>
  );
}
