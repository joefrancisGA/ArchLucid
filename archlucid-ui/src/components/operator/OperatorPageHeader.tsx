import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeading } from "@/components/PageHeading";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type OperatorPageHeaderProps = {
  title: string;
  /** Plain string or rich lead (e.g. bold label prefix on Overview). */
  subtitle?: ReactNode;
  /** Optional hierarchy label rendered above the title. */
  eyebrow?: string;
  /** Optional classes for the subtitle paragraph (non-`navHref` path). */
  subtitleClassName?: string;
  /** Canonical nav href — when set, renders the same icon as primary navigation. */
  navHref?: string;
  /** Rare override when nav-config has no icon for {@link navHref}. */
  icon?: LucideIcon;
  /** Stable Playwright anchor for the primary page title. */
  titleTestId?: string;
  /** Stable Playwright anchor for the subtitle / page lead. */
  subtitleTestId?: string;
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
  /** Optional status tag beside the title (navHref / PageHeading path only). */
  statusBadge?: ReactNode;
  actions?: ReactNode;
  /** Optional hierarchy trail rendered above the title row. */
  breadcrumb?: ReactNode;
  /** Page heading level when `navHref` renders {@link PageHeading}. Defaults to `h2` (shell chrome owns the document `h1`). */
  headingLevel?: "h1" | "h2";
  children?: ReactNode;
};

/**
 * Operator page chrome: title, optional subtitle, metadata, and actions.
 * Major page headings intentionally omit inline tooltip/info icons — use subtitle text or guidance links.
 */
export function OperatorPageHeader({
  title,
  subtitle,
  eyebrow,
  subtitleClassName,
  navHref,
  icon,
  titleTestId,
  subtitleTestId,
  metadata,
  statusBadge,
  actions,
  breadcrumb,
  headingLevel = "h2",
  children,
}: OperatorPageHeaderProps) {
  if (navHref !== undefined) {
    return (
      <div className="mb-6">
        {breadcrumb != null ? <div className="mb-2">{breadcrumb}</div> : null}
        <PageHeading
          navHref={navHref}
          icon={icon}
          title={title}
          description={subtitle}
          eyebrow={eyebrow}
          metadata={metadata}
          statusBadge={statusBadge}
          actions={actions}
          headingLevel={headingLevel}
          bordered
          titleTestId={titleTestId}
          descriptionTestId={subtitleTestId}
        >
          {children}
        </PageHeading>
      </div>
    );
  }

  const TitleTag = headingLevel === "h1" ? "h1" : "h2";

  return (
    <header className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
      {breadcrumb != null ? <div className="mb-2">{breadcrumb}</div> : null}
      {eyebrow !== undefined && eyebrow.length > 0 ? (
        <p className={cn("m-0 mb-2", OPERATOR_NAV_GROUP_LABEL)} data-testid="page-heading-eyebrow">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <TitleTag
          className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
          {...(titleTestId !== undefined ? { "data-testid": titleTestId } : {})}
        >
          {title}
        </TitleTag>
        {statusBadge != null ? <div className="flex items-center">{statusBadge}</div> : null}
        {actions != null && (
          <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {subtitle != null && (
        <div
          className={cn(
            "m-0 mt-2 text-neutral-500 dark:text-neutral-400",
            OPERATOR_TYPOGRAPHY.body,
            subtitleClassName,
          )}
          {...(subtitleTestId !== undefined ? { "data-testid": subtitleTestId } : {})}
        >
          {subtitle}
        </div>
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
