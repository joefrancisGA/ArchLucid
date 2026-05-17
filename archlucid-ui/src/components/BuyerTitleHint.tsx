"use client";

import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type BuyerTitleHintProps = {
  readonly text: string;
};

/** Info icon + tooltip for buyer-polished pages where the section purpose needs one-line clarification. */
export function BuyerTitleHint(props: BuyerTitleHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          aria-label={`About this section: ${props.text}`}
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-sm leading-snug">
        {props.text}
      </TooltipContent>
    </Tooltip>
  );
}
