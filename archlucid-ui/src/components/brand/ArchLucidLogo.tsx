import { cn } from "@/lib/utils";
import { forwardRef } from "react";

import { ArchLucidMark } from "@/components/brand/ArchLucidMark";
import { ARCHLUCID_BRAND } from "@/components/brand/brand-colors";
import { PRODUCT_LINE_DISPLAY_NAME } from "@/lib/product-line/product-line-display-name";

/**
 * Layout variants:
 *  - `full`    mark + wordmark at default scale (headers, marketing).
 *  - `mark`    icon only (favicons, dense rails, avatars).
 *  - `compact` smaller mark + tighter wordmark for dense operator chrome.
 */
export type ArchLucidLogoVariant = "full" | "mark" | "compact";

export type ArchLucidLogoProps = {
  variant?: ArchLucidLogoVariant;
  /**
   * Accessible name for the whole logo. Falls back to "ArchLucid". For the
   * `mark` variant this becomes the mark's `<title>`; for `full`/`compact` the
   * wordmark text itself provides the name and the mark stays decorative.
   */
  title?: string;
  /** Override the mark size in px. Defaults per variant. */
  size?: number;
  className?: string;
  /** Extra classes for the wordmark text (ignored by the `mark` variant). */
  wordmarkClassName?: string;
  /** Visible wordmark text. Defaults to the Architecture product name. */
  wordmarkText?: string;
  navyColor?: string;
  tealColor?: string;
};

const DEFAULT_WORDMARK_TEXT = PRODUCT_LINE_DISPLAY_NAME.architecture;
const DEFAULT_ACCESSIBLE_NAME = PRODUCT_LINE_DISPLAY_NAME.architecture;

/** Per-variant defaults kept in one place so callers rarely pass `size`. */
type VariantLayout = {
  markSize: number;
  rootClassName: string;
  wordmarkClassName: string;
};

function getVariantLayout(variant: ArchLucidLogoVariant): VariantLayout {
  switch (variant) {
    case "full":
      return {
        markSize: 32,
        rootClassName: "gap-2.5",
        wordmarkClassName: "text-2xl font-semibold tracking-tight",
      };
    case "compact":
      return {
        markSize: 24,
        rootClassName: "gap-2",
        wordmarkClassName: "text-lg font-semibold tracking-tight",
      };
    case "mark":
      return {
        markSize: 32,
        rootClassName: "",
        wordmarkClassName: "",
      };
    default: {
      // Exhaustiveness guard: a new variant must update this switch.
      const exhaustiveCheck: never = variant;

      return exhaustiveCheck;
    }
  }
}

/**
 * Composed ArchLucid logo. The wordmark is HTML/CSS text (not SVG text) so it
 * inherits the app's font stack and stays selectable / accessible; only the
 * mark is an SVG asset.
 */
export const ArchLucidLogo = forwardRef<HTMLSpanElement, ArchLucidLogoProps>(
  function ArchLucidLogo(
    {
      variant = "full",
      title,
      size,
      className,
      wordmarkClassName,
      wordmarkText = DEFAULT_WORDMARK_TEXT,
      navyColor = ARCHLUCID_BRAND.navy,
      tealColor = ARCHLUCID_BRAND.teal,
    },
    ref,
  ) {
    const layout = getVariantLayout(variant);
    const markSize = size ?? layout.markSize;
    const accessibleName = title ?? DEFAULT_ACCESSIBLE_NAME;

    if (variant === "mark") {
      return (
        <span
          ref={ref}
          className={cn("inline-flex shrink-0 items-center", className)}
        >
          <ArchLucidMark
            size={markSize}
            title={accessibleName}
            navyColor={navyColor}
            tealColor={tealColor}
          />
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex shrink-0 items-center",
          layout.rootClassName,
          className,
        )}
      >
        <ArchLucidMark
          size={markSize}
          navyColor={navyColor}
          tealColor={tealColor}
        />

        <span
          className={cn(
            "leading-none",
            layout.wordmarkClassName,
            wordmarkClassName,
          )}
          style={{ color: navyColor }}
        >
          {wordmarkText}
        </span>
      </span>
    );
  },
);
