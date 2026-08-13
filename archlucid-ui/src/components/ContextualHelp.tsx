"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ExternalLink } from "@/components/ui/external-link";
import { HelpPopover, HelpPopoverContent, HelpPopoverTrigger } from "@/components/ui/help-popover";
import { HelpTooltipTrigger } from "@/components/ui/help-tooltip-trigger";
import {
  contextualHelpByKey,
  contextualHelpTriggerAriaLabel,
  toDocsBlobUrl,
} from "@/lib/contextual-help-content";

/** Preferred side for the panel; Radix flips it when that side has no room. */
export type ContextualHelpPlacement = "top" | "right" | "bottom" | "left";

export type ContextualHelpProps = {
  helpKey: string;
  placement?: ContextualHelpPlacement;
  /** Optional class on the trigger wrapper. */
  className?: string;
};

/**
 * In-context help beside a label or status (not global Help). Press the info trigger to open;
 * Escape or an outside pointer closes it and returns focus to the trigger.
 *
 * Content comes from `contextualHelpByKey` in `src/lib/contextual-help-content.ts`; the trigger's
 * accessible name comes from {@link contextualHelpTriggerAriaLabel}.
 */
export function ContextualHelp({
  helpKey,
  placement = "bottom",
  className,
}: ContextualHelpProps) {
  const entry = contextualHelpByKey[helpKey];

  if (entry == null) {
    return null;
  }

  const { text, learnMoreUrl } = entry;
  const triggerAriaLabel = contextualHelpTriggerAriaLabel(helpKey);
  const moreHref = learnMoreUrl != null ? toDocsBlobUrl(learnMoreUrl) : null;

  return (
    <span className={cn("inline-flex items-center", className)}>
      <HelpPopover>
        <HelpPopoverTrigger asChild>
          <HelpTooltipTrigger
            size="contextual"
            icon="info"
            aria-label={triggerAriaLabel ?? "Contextual help"}
          />
        </HelpPopoverTrigger>

        <HelpPopoverContent
          side={placement}
          aria-label="Contextual help"
          className="w-64 leading-snug"
        >
          <div className={cn("m-0 text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>{text}</div>
          {moreHref != null && (
            <div className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
              <ExternalLink className={OPERATOR_LINK.optional} href={moreHref}>
                Learn more →
              </ExternalLink>
            </div>
          )}
        </HelpPopoverContent>
      </HelpPopover>
    </span>
  );
}
