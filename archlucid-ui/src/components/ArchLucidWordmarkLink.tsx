"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link, { type LinkProps } from "next/link";
import { forwardRef } from "react";

import { ArchLucidLogo, type ArchLucidLogoVariant } from "@/components/brand/ArchLucidLogo";
import { ARCHLUCID_BRAND } from "@/components/brand/brand-colors";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  productLineDisplayName,
  productLineShowsArchLucidMark,
  PRODUCT_LINE_DISPLAY_NAME,
} from "@/lib/product-line/product-line-display-name";

export type ArchLucidWordmarkLinkProps = Omit<LinkProps, "children"> & {
  variant: "operator" | "marketing";
  "aria-label": string;
  /** Merged with Radix <Button asChild> and layout utilities. */
  className?: string;
  /** Override default logo layout (operator → compact, marketing → full). */
  logoVariant?: ArchLucidLogoVariant;
  /** Override visible wordmark text. Operator chrome defaults from the active product line. */
  wordmarkText?: string;
};

type ResolvedLogoLayout = {
  logoVariant: ArchLucidLogoVariant;
  heightClass: string;
  size?: number;
  wordmarkClassName?: string;
};

/** Light-on-dark wordmark + navy mark parts for dark operator/marketing chrome. */
const DARK_SURFACE_NAVY = "#FFFFFF";

function resolveLogoLayout(
  variant: ArchLucidWordmarkLinkProps["variant"],
  logoVariantOverride?: ArchLucidLogoVariant,
): ResolvedLogoLayout {
  if (logoVariantOverride !== undefined) {
    return resolveExplicitLogoLayout(variant, logoVariantOverride);
  }

  if (variant === "operator") {
    return { logoVariant: "compact", heightClass: "h-8" };
  }

  return {
    logoVariant: "full",
    heightClass: "h-7",
    size: 28,
    wordmarkClassName: (cn("font-semibold tracking-tight leading-none", OPERATOR_TYPOGRAPHY.pageTitle)),
  };
}

function resolveExplicitLogoLayout(
  variant: ArchLucidWordmarkLinkProps["variant"],
  logoVariant: ArchLucidLogoVariant,
): ResolvedLogoLayout {
  const heightClass = variant === "operator" ? "h-8" : "h-7";

  if (logoVariant === "mark") {
    return {
      logoVariant: "mark",
      heightClass,
      size: variant === "operator" ? 32 : 28,
    };
  }

  if (logoVariant === "compact") {
    return { logoVariant: "compact", heightClass };
  }

  return {
    logoVariant: "full",
    heightClass,
    size: variant === "marketing" ? 28 : undefined,
    wordmarkClassName:
      variant === "marketing"
        ? (cn("font-semibold tracking-tight leading-none", OPERATOR_TYPOGRAPHY.pageTitle))
        : undefined,
  };
}

/**
 * Header wordmark link wrapping {@link ArchLucidLogo}. Render it directly — never inside
 * `<Button asChild>`, which frames the brand mark in button chrome (`UI_DESIGN_SYSTEM.md`
 * § Visible-boundary `Button` contract; TB-1671). The focus-visible ring lives here so the
 * link keeps a keyboard indicator without a wrapper.
 */
export const ArchLucidWordmarkLink = forwardRef<HTMLAnchorElement, ArchLucidWordmarkLinkProps>(
  function ArchLucidWordmarkLink(
    { variant, className, logoVariant, wordmarkText, "aria-label": ariaLabel, ...linkProps },
    ref,
  ) {
    const { productLine } = useProductLine();
    const layout = resolveLogoLayout(variant, logoVariant);
    const resolvedWordmarkText =
      wordmarkText
      ?? (variant === "operator" ? productLineDisplayName(productLine) : PRODUCT_LINE_DISPLAY_NAME.architecture);
    const showMark = productLineShowsArchLucidMark(productLine);

    return (
      <Link
        ref={ref}
        aria-label={ariaLabel}
        data-testid="archlucid-wordmark-link"
        {...linkProps}
        className={cn(
          "inline-flex shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
          layout.heightClass,
          className,
        )}
      >
        <ArchLucidLogo
          variant={layout.logoVariant}
          size={layout.size}
          wordmarkClassName={layout.wordmarkClassName}
          wordmarkText={resolvedWordmarkText}
          showMark={showMark}
          className="dark:hidden"
          tealColor={ARCHLUCID_BRAND.tealOnLightSurface}
        />

        <ArchLucidLogo
          variant={layout.logoVariant}
          size={layout.size}
          wordmarkClassName={layout.wordmarkClassName}
          wordmarkText={resolvedWordmarkText}
          showMark={showMark}
          className="hidden dark:inline-flex"
          navyColor={DARK_SURFACE_NAVY}
        />
      </Link>
    );
  },
);
