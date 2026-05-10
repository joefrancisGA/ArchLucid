"use client";

import { HelpCircle } from "lucide-react";

import { getHelpUrl } from "@/lib/contextual-help";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type HelpButtonProps = {
  pageKey: string;
  className?: string;
};

/**
 * Opens mapped operator documentation in a new tab; uses {@link getHelpUrl} (includes `NEXT_PUBLIC_DOCS_BASE_URL`).
 */
export function HelpButton({ pageKey, className }: HelpButtonProps) {
  const href = getHelpUrl(pageKey);

  if (href == null) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-400 bg-white text-neutral-500 shadow-sm hover:border-neutral-500 hover:text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-100",
              className,
            )}
            aria-label="View documentation"
          >
            <HelpCircle className="h-3 w-3" aria-hidden />
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom">View documentation</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
