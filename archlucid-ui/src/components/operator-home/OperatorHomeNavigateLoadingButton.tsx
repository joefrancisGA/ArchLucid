"use client";

import Link from "next/link";

import { ReviewStartInlineSpinner } from "@/components/review-intake/ReviewStartInlineSpinner";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  SOFT_NAVIGATION_HARD_FALLBACK_TIMEOUT_MS,
  useSoftNavigationLoading,
} from "@/hooks/use-soft-navigation-loading";
import { cn } from "@/lib/utils";

/** Home CTAs use the hard-nav fallback window (matches client navigation-stuck probe). */
export const OPERATOR_HOME_NAVIGATE_LOADING_TIMEOUT_MS = SOFT_NAVIGATION_HARD_FALLBACK_TIMEOUT_MS;

type OperatorHomeNavigateLoadingButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  readonly href: string;
  readonly idleLabel: string;
  readonly loadingLabel: string;
  readonly onNavigate?: () => void;
};

/** Home intent CTA link with immediate loading feedback for client-side route transitions. */
export function OperatorHomeNavigateLoadingButton(
  props: OperatorHomeNavigateLoadingButtonProps,
): React.JSX.Element {
  const { href, idleLabel, loadingLabel, disabled, className, variant, size, onNavigate, ...buttonProps } = props;
  const { navigate, isNavigating } = useSoftNavigationLoading({
    timeoutMs: OPERATOR_HOME_NAVIGATE_LOADING_TIMEOUT_MS,
  });

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled === true || isNavigating) {
      event.preventDefault();

      return;
    }

    event.preventDefault();
    onNavigate?.();
    navigate(href);
  };

  return (
    <Button
      {...buttonProps}
      asChild
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={disabled === true || isNavigating}
      aria-busy={isNavigating}
      data-loading={isNavigating ? "true" : "false"}
    >
      <Link href={href} onClick={onClick} aria-live="polite">
        {isNavigating ? (
          <>
            <ReviewStartInlineSpinner />
            <span>{loadingLabel}</span>
          </>
        ) : (
          idleLabel
        )}
      </Link>
    </Button>
  );
}
