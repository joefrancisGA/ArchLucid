import { cn } from "@/lib/utils";
import * as React from "react"

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn("flex min-h-[60px] w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 md: dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-600", OPERATOR_TYPOGRAPHY.body,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
