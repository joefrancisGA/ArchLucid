import { cn } from "@/lib/utils";
import * as React from "react"

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Neutralize browser autofill tint (Chrome's baby-blue) so inputs stay on design-system surfaces.
          "flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-al-text-primary shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-neutral-950 placeholder:text-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:file:text-neutral-50 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-600 autofill:shadow-[inset_0_0_0px_1000px_#fff] autofill:[-webkit-text-fill-color:inherit] dark:autofill:shadow-[inset_0_0_0px_1000px_#0a0a0a]",
          OPERATOR_TYPOGRAPHY.body,
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
