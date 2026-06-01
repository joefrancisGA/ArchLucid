"use client";

import { CircleHelp } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type BuyerTitleHintProps = {
  readonly text: string;
};

/** Context hint for buyer-polished pages where the section purpose needs one-line clarification. */
export function BuyerTitleHint(props: BuyerTitleHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 rounded p-0.5 text-neutral-500 hover:text-neutral-700 focus-visible:outline focus-visible:ring-2 dark:text-neutral-400 dark:hover:text-neutral-200"
          aria-label={`About this section: ${props.text}`}
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-sm leading-snug">
        {props.text}
      </TooltipContent>
    </Tooltip>
  );
}
