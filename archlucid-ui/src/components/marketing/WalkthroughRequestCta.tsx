"use client";

import { useSearchParams } from "next/navigation";

import { CtaButton } from "@/components/marketing/CtaButton";
import { buildWalkthroughCtaHref } from "@/lib/marketing/build-walkthrough-cta-href";
import { recordMarketingCtaWalkthroughClick } from "@/lib/marketing/marketing-clarity-custom-event";

/**
 * Hero primary CTA: opens configured booking URL with UTM carry-forward, else mailto fallback.
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
      variant="primary"
      size="lg"
      className={props.className}
      data-testid="welcome-request-walkthrough-cta"
      onPressAnalytics={onPressAnalytics}
    >
      Request walkthrough
    </CtaButton>
  );
}
