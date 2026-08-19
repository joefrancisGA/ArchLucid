"use client";

import { Input } from "@/components/ui/input";
import { IntakeFieldLabel } from "@/components/intake/IntakeFieldLabel";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type IntakeTextFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly required: boolean;
  readonly value: string;
  readonly placeholder: string;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly testId?: string;
  readonly onChange: (value: string) => void;
};

/** Single-line intake field with label, helper, and input in a consistent order. */
export function IntakeTextField(props: IntakeTextFieldProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <IntakeFieldLabel htmlFor={props.id} label={props.label} required={props.required} />
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
        {props.hint}
      </p>
      <Input
        id={props.id}
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
        disabled={props.disabled === true}
        placeholder={props.placeholder}
        data-testid={props.testId}
        aria-required={props.required}
        aria-invalid={props.invalid === true}
      />
    </div>
  );
}
