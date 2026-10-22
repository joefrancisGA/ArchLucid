import { MARKETING_ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/marketing-analytics-consent";

type ClarityApi = (action: string, ...args: string[]) => void;

/** Shared shape for hero CTA events ({@code cta_walkthrough_click}, {@code cta_self_demo_click}). */
export type MarketingHeroCtaAnalyticsProps = {
  readonly source: string;
  readonly utm_source?: string;
  readonly utm_medium?: string;
  readonly utm_campaign?: string;
};

export type CtaWalkthroughClickAnalyticsProps = MarketingHeroCtaAnalyticsProps;

function recordMarketingHeroCtaClarityEvent(
  eventName: "cta_walkthrough_click" | "cta_self_demo_click" | "cta_early_access_submit",
  properties: MarketingHeroCtaAnalyticsProps,
  emailDomainForAnalytics?: string,
): void {
  if (typeof window === "undefined") return;

  if (window.localStorage.getItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY) !== "granted") return;

  const clarity: ClarityApi | undefined = (window as Window & { clarity?: ClarityApi }).clarity;

  if (typeof clarity !== "function") return;

  clarity("set", "cta_source", properties.source);

  if (properties.utm_source !== undefined && properties.utm_source !== "") clarity("set", "cta_utm_source", properties.utm_source);

  if (properties.utm_medium !== undefined && properties.utm_medium !== "") clarity("set", "cta_utm_medium", properties.utm_medium);

  if (properties.utm_campaign !== undefined && properties.utm_campaign !== "")
    clarity("set", "cta_utm_campaign", properties.utm_campaign);

  if (emailDomainForAnalytics !== undefined && emailDomainForAnalytics !== "")
    clarity("set", "cta_email_domain", emailDomainForAnalytics);

  clarity("event", eventName);
}

/**
 * Emits Clarity custom dimensions + custom event when marketing analytics consent is granted and Clarity is loaded.
 * No-op on the operator shell or when consent is denied (same gate as {@link MicrosoftClarityLoader}).
 */
export function recordMarketingCtaWalkthroughClick(properties: MarketingHeroCtaAnalyticsProps): void {
  recordMarketingHeroCtaClarityEvent("cta_walkthrough_click", properties);
}

export function recordMarketingCtaSelfDemoClick(properties: MarketingHeroCtaAnalyticsProps): void {
  recordMarketingHeroCtaClarityEvent("cta_self_demo_click", properties);
}

/** Clarity event after successful **Join early access** form POST (not on click). */
export function recordMarketingCtaEarlyAccessSubmit(
  properties: MarketingHeroCtaAnalyticsProps & { readonly email_domain?: string },
): void {
  const emailDomain: string | undefined = properties.email_domain;

  recordMarketingHeroCtaClarityEvent(
    "cta_early_access_submit",
    {
      source: properties.source,
      utm_source: properties.utm_source,
      utm_medium: properties.utm_medium,
      utm_campaign: properties.utm_campaign,
    },
    emailDomain,
  );
}
