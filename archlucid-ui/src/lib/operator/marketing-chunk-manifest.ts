import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — marketing deferred chunk catalog. */
export const MARKETING_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "marketing-welcome-tier-pricing-section",
    label: "Loading packaging overview",
    variant: "marketing",
    modulePath: "@/components/marketing/MarketingTierPricingSection",
    exportName: "MarketingTierPricingSection",
  },
  {
    id: "marketing-first-touch-capture",
    label: "Loading first-touch capture",
    variant: "marketing",
    modulePath: "@/components/MarketingFirstTouchCapture",
    exportName: "MarketingFirstTouchCapture",
  },
  {
    id: "marketing-microsoft-clarity-loader",
    label: "Loading analytics loader",
    variant: "marketing",
    modulePath: "@/components/MicrosoftClarityLoader",
    exportName: "MicrosoftClarityLoader",
  },
  {
    id: "marketing-public-footer",
    label: "Loading footer",
    variant: "marketing",
    modulePath: "@/components/marketing/MarketingPublicFooter",
    exportName: "MarketingPublicFooter",
  },
  {
    id: "marketing-analytics-consent-banner",
    label: "Loading consent banner",
    variant: "marketing",
    modulePath: "@/components/MarketingAnalyticsConsentBanner",
    exportName: "MarketingAnalyticsConsentBanner",
  },
] as const;
