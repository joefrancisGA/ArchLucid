"use client";

import { InlineInfoTooltip } from "@/components/InlineInfoTooltip";
import { Label } from "@/components/ui/label";
import { OPERATOR_FORM_FIELD_LABEL_CLASS } from "@/lib/design-tokens";

export type WizardFieldHintProps = {
  /** When set, associates the visible label with a form control via Radix Label. Omit for section-only hints. */
  htmlFor?: string;
  label: string;
  hint: string;
};

/** Accessible label (or title) plus an inline info tooltip for field or section help text. */
export function WizardFieldHint({ htmlFor, label, hint }: WizardFieldHintProps) {
  const labelNode =
    htmlFor !== undefined && htmlFor.length > 0 ? (
      <Label htmlFor={htmlFor}>{label}</Label>
    ) : (
      <span className={OPERATOR_FORM_FIELD_LABEL_CLASS}>{label}</span>
    );

  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="wizard-field-hint">
      {labelNode}
      <InlineInfoTooltip label={label} hint={hint} />
    </div>
  );
}
