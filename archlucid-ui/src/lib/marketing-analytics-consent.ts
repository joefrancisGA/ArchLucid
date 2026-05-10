/** localStorage key for marketing-only optional analytics (TB-020). Not used on signed-in operator shell. */
export const MARKETING_ANALYTICS_CONSENT_STORAGE_KEY = "archlucid.marketingAnalyticsConsent.v1";

export type MarketingAnalyticsConsentValue = "granted" | "denied";

/** NEXT_PUBLIC_ArchLucid env: project id from Microsoft Clarity. Empty = analytics offer disabled. */
export function getMarketingClarityProjectId(): string {
  const raw = process.env.NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID?.trim();

  return raw ?? "";
}

export function isMarketingClarityConfigured(): boolean {
  return getMarketingClarityProjectId().length > 0;
}
