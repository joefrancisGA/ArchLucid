"use client";

import { InlineInfoTooltip } from "@/components/InlineInfoTooltip";
import { Label } from "@/components/ui/label";

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
      <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">{label}</span>
    );

  return (
    <div className="mb-1 flex flex-wrap items-center gap-2">
      {labelNode}
      <InlineInfoTooltip label={label} hint={hint} />
    </div>
  );
}
