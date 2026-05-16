"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MarketingCtaVariant = "primary" | "outline" | "secondary";

export type CtaButtonProps = {
  readonly href: string;
  readonly variant: MarketingCtaVariant;
  readonly size?: "default" | "sm" | "lg";
  readonly children: ReactNode;
  readonly className?: string;
  readonly onPressAnalytics?: () => void;
  /** When true, never opens {@code target="_blank"} (used for same-tab product deep links). */
  readonly sameTab?: boolean;
  readonly title?: string;
  readonly ariaDescribedby?: string;
  readonly "data-testid"?: string;
};

/**
 * Marketing CTA as a link-styled button (anchor + shadcn Button variants).
 */
export function CtaButton(props: CtaButtonProps) {
  const {
    href,
    variant,
    size = "lg",
    children,
    className,
    onPressAnalytics,
    sameTab = false,
    title,
    ariaDescribedby,
    "data-testid": dataTestId,
  } = props;
  const opensNewTab: boolean =
    !sameTab && (href.startsWith("http://") || href.startsWith("https://"));

  return (
    <Button asChild variant={variant} size={size} className={cn(className)}>
      <a
        href={href}
        data-testid={dataTestId}
        title={title}
        aria-describedby={ariaDescribedby}
        rel={opensNewTab ? "noopener noreferrer" : undefined}
        target={opensNewTab ? "_blank" : undefined}
        onClick={() => onPressAnalytics?.()}
      >
        {children}
      </a>
    </Button>
  );
}
