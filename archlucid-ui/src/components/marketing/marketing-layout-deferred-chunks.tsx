"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const MarketingFirstTouchCaptureDeferred: ComponentType = dynamic(
  () =>
    import("@/components/MarketingFirstTouchCapture").then(
      (module) => module.MarketingFirstTouchCapture,
    ),
  { ssr: false },
);

export const MicrosoftClarityLoaderDeferred: ComponentType<{ readonly projectId: string }> = dynamic(
  () =>
    import("@/components/MicrosoftClarityLoader").then((module) => module.MicrosoftClarityLoader),
  { ssr: false },
);

export const MarketingPublicFooterDeferred: ComponentType = dynamic(
  () =>
    import("@/components/marketing/MarketingPublicFooter").then(
      (module) => module.MarketingPublicFooter,
    ),
  {
    loading: () => (
      <div
        className="min-h-24 animate-pulse border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
        role="status"
        aria-label="Loading footer"
        data-testid="marketing-footer-deferred-loading"
      />
    ),
  },
);

export const MarketingAnalyticsConsentBannerDeferred: ComponentType<{
  readonly clarityProjectId: string;
}> = dynamic(
  () =>
    import("@/components/MarketingAnalyticsConsentBanner").then(
      (module) => module.MarketingAnalyticsConsentBanner,
    ),
  { ssr: false },
);
