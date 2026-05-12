"use client";

import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type WizardFieldHintProps = {
  /** When set, associates the visible label with a form control via Radix Label. Omit for section-only hints. */
  htmlFor?: string;
  label: string;
  hint: string;
};

/** Accessible label (or title) plus a compact “?” tooltip for field or section help text. */
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
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-teal-600/35 bg-white text-[11px] font-semibold text-teal-800 shadow-sm transition-colors hover:border-teal-600/60 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2 dark:border-teal-500/40 dark:bg-neutral-950 dark:text-teal-100 dark:hover:bg-teal-950/50 dark:focus-visible:ring-teal-500/35 dark:focus-visible:ring-offset-neutral-950"
            aria-label={`Help: ${label}`}
          >
            ?
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm" side="top">
          {hint}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
