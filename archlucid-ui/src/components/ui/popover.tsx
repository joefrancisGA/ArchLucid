"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Gap between the trigger and the floating panel. */
const POPOVER_SIDE_OFFSET_PX = 4;

/** Gap kept between the panel and the viewport edge after Radix flips or shifts it. */
const POPOVER_COLLISION_PADDING_PX = 8;

export const Popover = PopoverPrimitive.Root;

export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverClose = PopoverPrimitive.Close;

export type PopoverContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

/**
 * Floating panel anchored to its trigger. Radix owns collision-aware placement, focus movement,
 * and Escape / outside-pointer dismissal.
 *
 * `align="end"` is the default because these panels hang off right-aligned shell and header
 * controls. It replaces an earlier `absolute right-0` panel that required a `relative` ancestor
 * and could be clipped by the viewport edge or any `overflow-hidden` ancestor.
 */
export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      align = "end",
      sideOffset = POPOVER_SIDE_OFFSET_PX,
      collisionPadding = POPOVER_COLLISION_PADDING_PX,
      ...props
    },
    ref,
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 min-w-[18rem] max-w-[calc(100vw-2rem)] max-h-[--radix-popover-content-available-height] overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-md outline-none dark:border-neutral-700 dark:bg-neutral-900",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ),
);
PopoverContent.displayName = "PopoverContent";
