"use client";

import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type WizardFieldHintProps = {
  htmlFor: string;
  label: string;
  hint: string;
};

/** Accessible label plus a compact tooltip trigger for field help text. */
export function WizardFieldHint({ htmlFor, label, hint }: WizardFieldHintProps) {
  return (
    <div className="mb-1 flex flex-wrap items-center gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="rounded text-xs font-medium text-teal-700 underline decoration-dotted underline-offset-2 hover:text-teal-800"
            aria-label={`Help: ${label}`}
          >
            Help
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">{hint}</TooltipContent>
      </Tooltip>
    </div>
  );
}
