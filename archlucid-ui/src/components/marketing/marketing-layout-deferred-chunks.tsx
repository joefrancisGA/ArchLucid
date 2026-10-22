"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

function marketingPublicFooterDeferredLoading(): React.JSX.Element {
  return (
    <div
      className="min-h-24 animate-pulse border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
      role="status"
      aria-label="Loading footer"
      data-testid="marketing-footer-deferred-loading"
    />
  );
}

export const MarketingFirstTouchCaptureDeferred: ComponentType = createDeferredComponentFromManifest(
  "marketing-first-touch-capture",
  { suppressLoading: true },
);

export const MicrosoftClarityLoaderDeferred: ComponentType<{ readonly projectId: string }> =
  createDeferredComponentFromManifest("marketing-microsoft-clarity-loader", { suppressLoading: true });

export const MarketingPublicFooterDeferred: ComponentType = createDeferredComponentFromManifest(
  "marketing-public-footer",
  { loadingWrapper: () => marketingPublicFooterDeferredLoading() },
);

export const MarketingAnalyticsConsentBannerDeferred: ComponentType<{
  readonly clarityProjectId: string;
}> = createDeferredComponentFromManifest("marketing-analytics-consent-banner", { suppressLoading: true });
