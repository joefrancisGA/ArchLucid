import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type EmptyStateAction = {
  label: string;
  href: string;
  variant?: "primary" | "default" | "secondary" | "outline" | "destructive";
};

export type EmptyStateGettingStarted = {
  heading: string;
  steps: readonly string[];
};

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: ReactNode;
  actions?: EmptyStateAction[];
  /** Optional text link below primary actions (e.g. audit trail on governance idle). */
  secondaryAction?: EmptyStateAction;
  helpTopicPath?: string;
  /** When true, empty state is caused by active filters rather than missing data. */
  filteredEmpty?: boolean;
  /** Optional first-run “how it works” list shown below the description. */
  gettingStarted?: EmptyStateGettingStarted;
};

/**
 * Centered empty collection / idle state with optional icon, CTAs, and help deep-link.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  secondaryAction,
  helpTopicPath,
  gettingStarted,
  filteredEmpty = false,
}: EmptyStateProps) {
  const actionList = actions ?? [];

  return (
    <div role="status" aria-label={title} className="my-4">
      <Card className="border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          {Icon ? (
            <Icon className="h-12 w-12 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
          ) : null}
          <h3 className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{title}</h3>
          <p className={cn("max-w-md leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{description}</p>
          {filteredEmpty ? (
            <p className={cn("m-0 max-w-md text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              No rows match your current filters — clear filters or broaden the search to see more results.
            </p>
          ) : null}
          {gettingStarted !== undefined ? (
            <GettingStartedSteps
              heading={gettingStarted.heading}
              steps={gettingStarted.steps}
              className="w-full max-w-lg"
            />
          ) : null}
          {actionList.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {actionList.map((action, index) => {
                const isPrimary = index === 0 && action.variant === undefined;
                const variant = isPrimary ? "primary" : (action.variant ?? "outline");

                return (
                  <Button
                    key={`${action.href}-${action.label}`}
                    asChild
                    variant={variant}
                  >
                    <Link href={action.href}>{action.label}</Link>
                  </Button>
                );
              })}
            </div>
          ) : null}
          {secondaryAction !== undefined ? (
            <Link
              href={secondaryAction.href}
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
            >
              {secondaryAction.label}
            </Link>
          ) : null}
          {helpTopicPath ? (
            <Link
              href={helpTopicPath.startsWith("/") ? helpTopicPath : `/help/${helpTopicPath}`}
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
            >
              Learn more
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
