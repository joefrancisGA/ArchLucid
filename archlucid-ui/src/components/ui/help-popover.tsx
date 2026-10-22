"use client";

import * as React from "react";

import {
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps,
} from "@/components/ui/popover";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Slightly wider gap than the generic popover so the help icon stays legible under the panel edge. */
const HELP_POPOVER_SIDE_OFFSET_PX = 6;

export const HelpPopover = Popover;

export const HelpPopoverTrigger = PopoverTrigger;

export const HelpPopoverAnchor = PopoverAnchor;

export const HelpPopoverClose = PopoverClose;

export type HelpPopoverContentProps = PopoverContentProps;

/**
 * Help panel presentation layered on the generic popover primitive: narrower, denser, and
 * left-aligned to the trigger so prose starts where the reader's eye already is.
 *
 * Help affordances are press-triggered, not hover-triggered — the panels contain links, and
 * hover-only reveal makes those unreachable by keyboard and touch. Use a tooltip instead when the
 * content is a short, non-interactive hint.
 */
export const HelpPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverContent>,
  HelpPopoverContentProps
>(({ className, align = "start", sideOffset = HELP_POPOVER_SIDE_OFFSET_PX, ...props }, ref) => (
  <PopoverContent
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "w-72 rounded-md px-3 py-2 text-left text-neutral-900 dark:text-neutral-100",
      OPERATOR_TYPOGRAPHY.body,
      className,
    )}
    {...props}
  />
));
HelpPopoverContent.displayName = "HelpPopoverContent";
