import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type EnterpriseCompactEmptyStateAction = {
  readonly label: string;
  readonly href: string;
  readonly variant?: "primary" | "outline";
};

export type EnterpriseCompactEmptyStateProps = {
  readonly title: string;
  readonly description: string;
  readonly actions?: readonly EnterpriseCompactEmptyStateAction[];
  readonly testId?: string;
};

/**
 * Illustration-free IBM Carbon compact empty state (dashed border, left-aligned copy).
 * Prefer over centered {@link EmptyState} cards on dense operator surfaces.
 */
export function EnterpriseCompactEmptyState(props: EnterpriseCompactEmptyStateProps): ReactElement {
  const { title, description, actions, testId } = props;
  const actionList = actions ?? [];

  return (
    <div
      role="status"
      aria-label={title}
      data-testid={testId}
      className={cn(
        "rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700",
        OPERATOR_LAYOUT.sectionStack,
      )}
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.section, "text-neutral-900 dark:text-neutral-100")}>{title}</p>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-neutral-600 dark:text-neutral-400")}>{description}</p>
      {actionList.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {actionList.map((action, index) => {
            const isPrimary = action.variant === "primary" || (action.variant === undefined && index === 0);

            return (
              <Button
                key={action.href}
                asChild
                size="sm"
                variant={isPrimary ? "default" : "outline"}
                className={isPrimary ? undefined : "border-neutral-300 dark:border-neutral-600"}
              >
                <Link href={action.href}>{action.label}</Link>
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
