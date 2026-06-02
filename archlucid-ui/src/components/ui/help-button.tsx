"use client";

import { CircleHelp } from "lucide-react";

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
              "inline-flex shrink-0 rounded p-0.5 text-neutral-500 hover:text-neutral-700 focus-visible:outline focus-visible:ring-2 dark:text-neutral-400 dark:hover:text-neutral-200",
              className,
            )}
            aria-label="View documentation"
          >
            <CircleHelp className="h-3.5 w-3.5" aria-hidden />
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom">View documentation</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
