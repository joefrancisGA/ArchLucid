"use client";

import Link from "next/link";
import type { MouseEventHandler } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OPERATOR_LINK, TOOLTIP_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type VocabularyRailCompactLinkProps = {
  readonly href: string;
  readonly className?: string;
  readonly testId: string;
  readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
  readonly tooltip?: string;
  readonly tooltipTitle?: string;
  readonly children: React.ReactNode;
};

/**
 * Compact vocabulary peer link — optional dotted-underline tooltip for unfamiliar product terms.
 */
export function VocabularyRailCompactLink(props: VocabularyRailCompactLinkProps): React.JSX.Element {
  const link = (
    <Link
      href={props.href}
      className={props.className}
      data-testid={props.testId}
      onClick={props.onClick}
    >
      {props.children}
    </Link>
  );

  if (props.tooltip === undefined || props.tooltip.length === 0) {
    return link;
  }

  const tooltipTitle =
    props.tooltipTitle !== undefined && props.tooltipTitle.length > 0
      ? props.tooltipTitle
      : String(props.children);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={props.href}
          className={cn(
            props.className,
            "cursor-help border-b border-dotted border-neutral-500 underline-offset-2 dark:border-neutral-400",
          )}
          data-testid={props.testId}
          onClick={props.onClick}
        >
          {props.children}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="pointer-events-auto max-w-sm py-2">
        <p className={cn("m-0", TOOLTIP_TYPOGRAPHY.title)}>{tooltipTitle}</p>
        <p className={cn("mb-0 mt-1.5 leading-snug", TOOLTIP_TYPOGRAPHY.body)}>{props.tooltip}</p>
        <p className={cn("mb-0 mt-2", TOOLTIP_TYPOGRAPHY.body)}>
          <span className={TOOLTIP_TYPOGRAPHY.link}>Open guide →</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
