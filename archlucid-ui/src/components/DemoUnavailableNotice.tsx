import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import type { ReactNode } from "react";

export type DemoUnavailableNoticeProps = {
  title: string;
  description?: string;
  learnMoreHref?: string;
  learnMoreLabel?: string;
  className?: string;
  children?: ReactNode;
};

/**
 * Neutral “feature not available in this environment” card for demo builds and demo-mode guards.
 * Uses the same visual register as {@link OperatorEmptyState} without importing operator shell messages.
 */
export function DemoUnavailableNotice({
  title,
  description,
  learnMoreHref,
  learnMoreLabel = "Learn more",
  className,
  children,
}: DemoUnavailableNoticeProps) {
  return (
    <div
      role="status"
      data-testid="demo-unavailable-notice"
      className={cn("mb-4 max-w-3xl rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 leading-snug text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper,
        className,
      )}
    >
      <strong className="block text-neutral-900 dark:text-neutral-100">{title}</strong>
      {description ? <p className={cn("mt-2 mb-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{description}</p> : null}
      {children ? <div className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>{children}</div> : null}
      {learnMoreHref ? (
        <p className="mt-3 mb-0">
          <Link
            href={learnMoreHref}
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
          >
            {learnMoreLabel}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
