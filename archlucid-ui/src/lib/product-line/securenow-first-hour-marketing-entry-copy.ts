export const SECURENOW_FIRST_HOUR_MARKETING_FROM_PARAM = "why-securenow" as const;

export const SECURENOW_FIRST_HOUR_MARKETING_SKU_BAND_LEAD =
  "You opened first hour from the public SecureNow story. Beta evaluation contents and exclusions repeat here — fixture capture still required." as const;

export function buildSecureNowFirstHourMarketingHref(): string {
  return `/administration/securenow-first-hour?from=${encodeURIComponent(SECURENOW_FIRST_HOUR_MARKETING_FROM_PARAM)}`;
}
