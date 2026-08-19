import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export const HELP_CENTER_DOCUMENTATION_BADGE_LABEL = "Documentation" as const;

type HelpCenterDocumentationBadgeProps = {
  readonly className?: string;
};

/** Distinguishes technical-documentation entries from product guides on `/help`. */
export function HelpCenterDocumentationBadge(props: HelpCenterDocumentationBadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-medium uppercase tracking-wide text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200",
        OPERATOR_TYPOGRAPHY.micro,
        props.className,
      )}
      data-testid="help-center-documentation-badge"
    >
      {HELP_CENTER_DOCUMENTATION_BADGE_LABEL}
    </span>
  );
}
