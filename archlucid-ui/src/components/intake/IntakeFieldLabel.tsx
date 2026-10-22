"use client";

import { Label } from "@/components/ui/label";
import { OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type IntakeFieldLabelProps = {
  readonly htmlFor: string;
  readonly label: string;
  readonly required: boolean;
  /** When false, omits the (required)/(optional) suffix — use when section chrome already states requiredness. */
  readonly showRequirednessSuffix?: boolean;
  /** When true, renders as a fieldset legend instead of a label (legend cannot use htmlFor). */
  readonly asLegend?: boolean;
};

function intakeFieldLabelSuffix(required: boolean): React.JSX.Element {
  return (
    <span
      className={cn(
        "font-normal text-neutral-500 dark:text-neutral-400",
        OPERATOR_TYPOGRAPHY.helper,
      )}
    >
      {required ? " (required)" : " (optional)"}
    </span>
  );
}

/** Field label that states required/optional inline, so the operator never has to infer it. */
export function IntakeFieldLabel(props: IntakeFieldLabelProps): React.JSX.Element {
  const className = OPERATOR_FORM_FIELD_LABEL_CLASS;
  const showRequirednessSuffix = props.showRequirednessSuffix !== false;

  if (props.asLegend === true) {
    return (
      <legend id={props.htmlFor} className={className}>
        {props.label}
        {showRequirednessSuffix ? intakeFieldLabelSuffix(props.required) : null}
      </legend>
    );
  }

  return (
    <Label htmlFor={props.htmlFor} className={className}>
      {props.label}
      {showRequirednessSuffix ? intakeFieldLabelSuffix(props.required) : null}
    </Label>
  );
}
