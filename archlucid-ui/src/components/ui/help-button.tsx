"use client";

import { CircleHelp } from "lucide-react";

import { ExternalLink } from "@/components/ui/external-link";
import { helpTooltipIconClassName, helpTooltipLinkClassName } from "@/components/ui/help-tooltip-trigger";
import { getHelpUrl } from "@/lib/contextual-help";
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
          <ExternalLink
            href={href}
            className={helpTooltipLinkClassName("contextual", className)}
            aria-label="View documentation"
            data-help-tooltip-trigger=""
            data-help-tooltip-icon="help"
          >
            <CircleHelp className={helpTooltipIconClassName("contextual")} aria-hidden />
          </ExternalLink>
        </TooltipTrigger>
        <TooltipContent side="bottom">View documentation</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
