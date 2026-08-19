import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_TOPIC_PAGE_ICON, isHelpTopicHref } from "@/lib/help/help-topic-page-icon";
import { resolveNavIconForHref } from "@/lib/resolve-nav-link-for-pathname";

const PAGE_HEADING_ICON_CLASS =
  "h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200";

const PAGE_HEADING_TILE_CLASS =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-900";

export type NavDerivedPageIconProps = {
  /** Canonical nav href used to resolve the decorative icon from nav-config. */
  navHref: string;
  /** Rare override when nav-config has no icon for the route. */
  icon?: LucideIcon;
};

/** Decorative nav-config icon for custom page headers (detail surfaces, etc.). */
export function NavDerivedPageIcon({ navHref, icon }: NavDerivedPageIconProps): React.JSX.Element | null {
  const ResolvedIcon =
    icon ?? resolveNavIconForHref(navHref) ?? (isHelpTopicHref(navHref) ? HELP_TOPIC_PAGE_ICON : undefined);

  if (ResolvedIcon === undefined) {
    return null;
  }

  return (
    // eslint-disable-next-line react-hooks/static-components -- Lucide icon resolved from navHref
    <ResolvedIcon className={PAGE_HEADING_ICON_CLASS} data-testid="page-heading-icon" aria-hidden />
  );
}

export type PageHeadingProps = {
  /** Canonical nav href used to resolve the decorative icon from nav-config. */
  navHref: string;
  title: string;
  description?: ReactNode;
  /** Optional hierarchy label rendered above the title (for example help topic grouping). */
  eyebrow?: string;
  metadata?: ReactNode;
  /** Rare override when nav-config has no icon for the route. */
  icon?: LucideIcon;
  headingLevel?: "h1" | "h2";
  variant?: "default" | "integration";
  statusBadge?: ReactNode;
  actions?: ReactNode;
  bordered?: boolean;
  className?: string;
  titleTestId?: string;
  /** Stable Playwright anchor for the page lead / description block. */
  descriptionTestId?: string;
  "data-testid"?: string;
  children?: ReactNode;
};

/**
 * Top-level page heading with optional nav-derived icon.
 * Icons are decorative; the heading text remains the accessible page name.
 */
export function PageHeading({
  navHref,
  title,
  description,
  eyebrow,
  metadata,
  icon,
  headingLevel = "h1",
  variant = "default",
  statusBadge,
  actions,
  bordered = false,
  className,
  titleTestId,
  descriptionTestId,
  "data-testid": dataTestId,
  children,
}: PageHeadingProps): React.JSX.Element {
  const Icon =
    icon ?? resolveNavIconForHref(navHref) ?? (isHelpTopicHref(navHref) ? HELP_TOPIC_PAGE_ICON : undefined);
  const HeadingTag = headingLevel;

  const iconNode =
    Icon !== undefined ? (
      variant === "integration" ? (
        <div className={PAGE_HEADING_TILE_CLASS} data-testid="page-heading-icon-tile" aria-hidden>
          <NavDerivedPageIcon navHref={navHref} icon={Icon} />
        </div>
      ) : (
        <NavDerivedPageIcon navHref={navHref} icon={Icon} />
      )
    ) : null;

  return (
    <header
      className={cn(
        bordered && "border-b border-neutral-200 pb-6 dark:border-neutral-800",
        className,
      )}
      data-testid={dataTestId}
      data-nav-href={navHref}
    >
      <div className="flex flex-wrap items-start gap-3">
        {iconNode}
        <div className="min-w-0 flex-1 space-y-2">
          {eyebrow !== undefined && eyebrow.length > 0 ? (
            <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)} data-testid="page-heading-eyebrow">
              {eyebrow}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <HeadingTag
              className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
              {...(titleTestId !== undefined ? { "data-testid": titleTestId } : {})}
            >
              {title}
            </HeadingTag>
            {statusBadge}
            {actions !== undefined && actions !== null ? (
              <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>

          {description !== undefined && description !== null ? (
            <div
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              {...(descriptionTestId !== undefined ? { "data-testid": descriptionTestId } : {})}
            >
              {description}
            </div>
          ) : null}

          {metadata !== undefined && metadata !== null ? (
            <div
              className={cn(
                "flex flex-wrap gap-x-4 gap-y-1 text-neutral-600 dark:text-neutral-400",
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {metadata}
            </div>
          ) : null}
        </div>
      </div>

      {children !== undefined && children !== null ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
