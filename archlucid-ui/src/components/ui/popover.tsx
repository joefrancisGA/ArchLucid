"use client";

import * as React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/** Click-to-toggle panel built on Radix Collapsible (no extra dependency). */
const Popover = Collapsible;

const PopoverTrigger = CollapsibleTrigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsibleContent>
>(({ className, ...props }, ref) => (
  <CollapsibleContent
    ref={ref}
    className={cn(
      "absolute right-0 z-50 mt-1 min-w-[18rem] rounded-lg border border-neutral-200 bg-white p-4 shadow-md dark:border-neutral-700 dark:bg-neutral-900",
      className,
    )}
    {...props}
  />
));
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
