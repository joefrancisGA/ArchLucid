"use client";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { Label } from "@/components/ui/label";

export type FormFieldLabelWithHelpProps = {
  readonly htmlFor: string;
  readonly label: string;
  readonly hint: string;
};

/** Form label plus a keyboard-accessible hint for a technical term. */
export function FormFieldLabelWithHelp(props: FormFieldLabelWithHelpProps): React.ReactElement {
  const { htmlFor, label, hint } = props;

  return (
    <span className="inline-flex items-center gap-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      <FieldHelpTooltip label={label} hint={hint} />
    </span>
  );
}
