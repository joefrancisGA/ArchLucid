"use client";

import Image from "next/image";
import Link, { type LinkProps } from "next/link";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { useTenantBrandingPresentationQuery } from "@/hooks/use-tenant-branding-presentation-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveTenantLogoProxyUrl } from "@/lib/tenant-branding-client";
import { cn } from "@/lib/utils";

type TenantMastheadWordmarkProps = Omit<LinkProps, "children"> & {
  readonly variant: "operator" | "marketing";
  readonly "aria-label": string;
  readonly className?: string;
};

/**
 * Tenant-aware masthead: company name + logo when Active profile applies; product wordmark otherwise.
 * Marketing variant always renders product branding.
 */
export function TenantMastheadWordmark(props: TenantMastheadWordmarkProps): React.JSX.Element {
  const { variant, className, "aria-label": ariaLabel, ...linkProps } = props;

  if (variant === "marketing") {
    return (
      <ArchLucidWordmarkLink
        variant="marketing"
        aria-label={ariaLabel}
        className={className}
        {...linkProps}
      />
    );
  }

  const { data: presentation } = useTenantBrandingPresentationQuery({ context: "ApplicationHeader" });

  if (!presentation?.usesTenantVisualBrand || presentation.isProductBrand) {
    return (
      <ArchLucidWordmarkLink
        variant="operator"
        aria-label={ariaLabel}
        className={className}
        {...linkProps}
      />
    );
  }

  const logoUrl = resolveTenantLogoProxyUrl(presentation);
  const displayName = presentation.mastheadDisplayName.trim();

  return (
    <Link
      aria-label={ariaLabel}
      data-testid="tenant-masthead-wordmark-link"
      {...linkProps}
      className={cn(
        "inline-flex min-w-0 max-w-full shrink items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,var(--al-accent-border-focus))] focus-visible:ring-offset-2",
        className,
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          aria-hidden
          width={32}
          height={32}
          unoptimized
          className="h-8 w-auto max-w-[8rem] object-contain"
          data-testid="tenant-masthead-logo"
        />
      ) : null}
      {displayName.length > 0 ? (
        <span
          className={cn(
            "truncate font-semibold text-[var(--brand-foreground,var(--al-text-primary))]",
            OPERATOR_TYPOGRAPHY.pageTitle,
          )}
          data-testid="tenant-masthead-display-name"
        >
          {displayName}
        </span>
      ) : null}
      {presentation.showPoweredByArchLucid ? (
        <span className="hidden text-xs text-al-text-secondary lg:inline" data-testid="tenant-masthead-powered-by">
          Powered by ArchLucid
        </span>
      ) : null}
    </Link>
  );
}
