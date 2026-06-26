import type { ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorPageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Stable Playwright anchor for the primary page title. */
  titleTestId?: string;
  /**
   * @deprecated Heading-level contextual help icons are not rendered. Use `subtitle` or in-page guidance links.
   */
  helpKey?: string;
  /**
   * @deprecated Heading-level tooltip hints are not rendered. Fold copy into `subtitle` instead.
   */
  buyerTitleHint?: string;
  /**
   * @deprecated Heading-level docs icons are not rendered. Use actions or subtitle guidance links.
   */
  buyerAllowHeaderDocsLink?: boolean;
  /**
   * @deprecated Heading-level docs icons are not rendered. Use actions or subtitle guidance links.
   */
  docsPageKey?: string;
  metadata?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

/**
 * Operator page chrome: title, optional subtitle, metadata, and actions.
 * Major page headings intentionally omit inline tooltip/info icons — use subtitle text or guidance links.
 */
export function OperatorPageHeader({
  title,
  subtitle,
  titleTestId,
  metadata,
  actions,
  children,
}: OperatorPageHeaderProps) {
  return (
    <header className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-2">
        <h2
          className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
          {...(titleTestId !== undefined ? { "data-testid": titleTestId } : {})}
        >
          {title}
        </h2>
        {actions != null && (
          <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {subtitle != null && (
        <p className={cn("m-0 mt-2 max-w-2xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {subtitle}
        </p>
      )}

      {metadata != null && (
        <div className={cn("mt-2 flex flex-wrap gap-x-4 gap-y-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {metadata}
        </div>
      )}

      {children != null && <div className="mt-4">{children}</div>}
    </header>
  );
}
