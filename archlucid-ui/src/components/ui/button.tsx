import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * Shared by `secondary` and `default`. A button that does not declare a variant must not
 * out-compete the teal `primary` action for emphasis, so the implicit variant is this quiet
 * neutral fill rather than a near-black one.
 */
const SECONDARY_BUTTON_CLASS =
  "border border-neutral-400 bg-neutral-200 text-neutral-900 hover:bg-neutral-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-600";

const buttonVariants = cva(
  (cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", OPERATOR_TYPOGRAPHY.button)),
  {
    variants: {
      variant: {
        default: SECONDARY_BUTTON_CLASS,
        primary:
          "bg-[var(--al-primary-action-bg)] text-[var(--al-primary-action-fg)] hover:bg-[var(--al-primary-action-bg-hover)] focus-visible:ring-[var(--al-primary-action-ring)]",
        secondary: SECONDARY_BUTTON_CLASS,
        destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700",
        outline:
          "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
