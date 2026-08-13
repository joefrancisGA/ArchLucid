import { cn } from "@/lib/utils";
import { METADATA_STATUS_TAG_SHELL, OPERATOR_DANGER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

/**
 * Action-oriented badge variants. For read-only status/severity labels use
 * `StatusTag`, `SeverityTag`, or `StatusPill` — not `Badge` variant `metadata`.
 */
const badgeVariants = cva(
  (cn("inline-flex items-center rounded-md border border-neutral-200 px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 dark:border-neutral-800 dark:focus:ring-neutral-600", OPERATOR_TYPOGRAPHY.badge)),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-900 text-neutral-50 shadow hover:bg-neutral-900/80 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/80",
        secondary:
          "border-transparent bg-neutral-200 text-neutral-900 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80",
        destructive: cn("border-transparent shadow", OPERATOR_DANGER.action),
        outline: "text-neutral-950 dark:text-neutral-50",
        metadata: cn(
          METADATA_STATUS_TAG_SHELL,
          "border-0 bg-neutral-500/10 text-al-text-secondary dark:bg-neutral-500/15",
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
