"use client";

import { useSearchParams } from "next/navigation";

import { CtaButton } from "@/components/marketing/CtaButton";
import { MARKETING_HERO_SECONDARY_CTA_CLASS } from "@/lib/design-tokens";
import { buildWalkthroughCtaHref } from "@/lib/marketing/build-walkthrough-cta-href";
import { recordMarketingCtaWalkthroughClick } from "@/lib/marketing/marketing-clarity-custom-event";
import { cn } from "@/lib/utils";

/**
 * Hero optional CTA: opens configured booking URL with UTM carry-forward, else mailto fallback.
 * Deliberately secondary to self-serve inspection — a walkthrough is help on request, not a gate to value.
 */
export function WalkthroughRequestCta(props: { readonly className?: string }) {
  const searchParams = useSearchParams();
  const origin: string = typeof window === "undefined" ? "https://localhost" : window.location.origin;
  const href: string = buildWalkthroughCtaHref(searchParams, origin);

  const onPressAnalytics = (): void => {
    recordMarketingCtaWalkthroughClick({
      source: "hero",
      utm_source: searchParams.get("utm_source") ?? undefined,
      utm_medium: searchParams.get("utm_medium") ?? undefined,
      utm_campaign: searchParams.get("utm_campaign") ?? undefined,
    });
  };

  return (
    <CtaButton
      href={href}
      variant="outline"
      size="lg"
      className={cn(MARKETING_HERO_SECONDARY_CTA_CLASS, props.className)}
      data-testid="welcome-request-walkthrough-cta"
      onPressAnalytics={onPressAnalytics}
    >
      Request optional walkthrough
    </CtaButton>
  );
}
