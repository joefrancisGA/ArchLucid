"use client";
import { OPERATOR_TYPOGRAPHY, CTA_WIDTH } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useSearchParams } from "next/navigation";

import { CtaButton } from "@/components/marketing/CtaButton";
import { buildSelfDemoCtaHref } from "@/lib/marketing/build-self-demo-cta-href";
import { recordMarketingCtaSelfDemoClick } from "@/lib/marketing/marketing-clarity-custom-event";

/** Owner / legal-approved disclosure (hero self-demo; does not claim paid-tenant parity). */
export const SELF_DEMO_HERO_DISCLOSURE_COPY =
  "Inspect a formal sample review — no sign-up required. Uses fabricated data only.";

const SELF_DEMO_DISCLOSURE_ID = "welcome-self-demo-disclosure";

/**
 * Hero secondary CTA → Workspace A (configurable via {@code NEXT_PUBLIC_SELF_DEMO_URL}), same tab, UTM preserved.
 */
export function SelfDemoRequestCta(props: { readonly className?: string }) {
  const searchParams = useSearchParams();
  const origin: string = typeof window === "undefined" ? "https://localhost" : window.location.origin;
  const href: string = buildSelfDemoCtaHref(searchParams, origin);

  const onPressAnalytics = (): void => {
    recordMarketingCtaSelfDemoClick({
      source: "hero",
      utm_source: searchParams.get("utm_source") ?? undefined,
      utm_medium: searchParams.get("utm_medium") ?? undefined,
      utm_campaign: searchParams.get("utm_campaign") ?? undefined,
    });
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-1 sm:w-auto sm:max-w-[18rem] sm:items-start",
        props.className,
      )}
    >
      <CtaButton
        href={href}
        variant="primary"
        size="lg"
        sameTab
        className={cn("min-h-11 px-8 font-semibold shadow-sm", CTA_WIDTH.content, "sm:min-w-[12rem]")}
        ariaDescribedby={SELF_DEMO_DISCLOSURE_ID}
        data-testid="welcome-self-demo-cta"
        onPressAnalytics={onPressAnalytics}
      >
        Inspect a formal sample review
      </CtaButton>
      <p
        id={SELF_DEMO_DISCLOSURE_ID}
        className={cn("text-center leading-snug text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
      >
        {SELF_DEMO_HERO_DISCLOSURE_COPY}
      </p>
    </div>
  );
}
