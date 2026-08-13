import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";

export type EnterpriseCompactEmptyStateAction = {
  readonly label: string;
  readonly href: string;
  readonly variant?: "primary" | "outline";
};

export type EnterpriseCompactEmptyStateProps = {
  readonly title: string;
  readonly description: ReactNode;
  readonly actions?: readonly EnterpriseCompactEmptyStateAction[];
  /** Optional client actions (e.g. demo seed button) rendered after link actions. */
  readonly footer?: ReactNode;
  readonly testId?: string;
};

/**
 * Illustration-free IBM Carbon compact empty state (dashed border, left-aligned copy).
 * Prefer over centered {@link EmptyState} cards on dense operator surfaces.
 */
export function EnterpriseCompactEmptyState(props: EnterpriseCompactEmptyStateProps): ReactElement {
  const { title, description, actions, footer, testId } = props;
  const actionList = actions ?? [];
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      role="status"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-testid={testId}
      className={cn(
        "rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700",
        OPERATOR_LAYOUT.sectionStack,
      )}
    >
      <p id={titleId} className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>
        {title}
      </p>
      <div
        id={descriptionId}
        className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}
      >
        {description}
      </div>
      {footer ? <div className="flex flex-wrap gap-2 pt-1">{footer}</div> : null}
      {actionList.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {actionList.map((action, index) => {
            const isPrimary = action.variant === "primary" || (action.variant === undefined && index === 0);

            return (
              <Button
                key={`${action.href}-${action.label}`}
                asChild
                size="sm"
                variant={isPrimary ? "primary" : "outline"}
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
