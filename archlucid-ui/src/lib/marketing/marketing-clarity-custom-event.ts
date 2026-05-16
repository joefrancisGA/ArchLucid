import { MARKETING_ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/marketing-analytics-consent";

type ClarityApi = (action: string, ...args: string[]) => void;

export type CtaWalkthroughClickAnalyticsProps = {
  readonly source: string;
  readonly utm_source?: string;
  readonly utm_medium?: string;
  readonly utm_campaign?: string;
};

/**
 * Emits Clarity custom dimensions + custom event when marketing analytics consent is granted and Clarity is loaded.
 * No-op on the operator shell or when consent is denied (same gate as {@link MicrosoftClarityLoader}).
 */
export function recordMarketingCtaWalkthroughClick(properties: CtaWalkthroughClickAnalyticsProps): void {
  if (typeof window === "undefined") return;

  if (window.localStorage.getItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY) !== "granted") return;

  const clarity: ClarityApi | undefined = (window as Window & { clarity?: ClarityApi }).clarity;

  if (typeof clarity !== "function") return;

  clarity("set", "cta_source", properties.source);

  if (properties.utm_source !== undefined && properties.utm_source !== "") clarity("set", "cta_utm_source", properties.utm_source);

  if (properties.utm_medium !== undefined && properties.utm_medium !== "") clarity("set", "cta_utm_medium", properties.utm_medium);

  if (properties.utm_campaign !== undefined && properties.utm_campaign !== "")
    clarity("set", "cta_utm_campaign", properties.utm_campaign);

  clarity("event", "cta_walkthrough_click");
}
