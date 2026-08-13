import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingJsonLd } from "@/components/MarketingJsonLd";
import { MarketingTooltipProvider } from "@/components/marketing/MarketingTooltipProvider";
import { MarketingPublicHeader } from "@/components/marketing/MarketingPublicHeader";
import {
  MarketingAnalyticsConsentBannerDeferred,
  MarketingFirstTouchCaptureDeferred,
  MarketingPublicFooterDeferred,
  MicrosoftClarityLoaderDeferred,
} from "@/components/marketing/marketing-layout-deferred-chunks";
import { ShellReadySurface } from "@/components/ShellReadySurface";
import { MARKETING_LAYOUT } from "@/lib/design-tokens";
import { getMarketingClarityProjectId } from "@/lib/marketing-analytics-consent";
import { resolveMarketingLiveDemoApiBase } from "@/lib/marketing-live-demo-api-base";
import { isMarketingLiveDemoLinkEnabled } from "@/lib/public-demo-mode";

export const metadata: Metadata = {
  title: "Welcome",
  description: "ArchLucid trial signup and product overview.",
};

/**
 * Public marketing chrome (no operator sidebar). Root `layout.tsx` still supplies global styles and color script.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  const liveDemoLinked =
    isMarketingLiveDemoLinkEnabled() && resolveMarketingLiveDemoApiBase().length > 0;
  const clarityProjectId = getMarketingClarityProjectId();

  return (
    <ShellReadySurface className={cn("min-h-screen", MARKETING_LAYOUT.page)}>
      <MarketingTooltipProvider>
        <MarketingFirstTouchCaptureDeferred />
        <MarketingJsonLd />
        <MicrosoftClarityLoaderDeferred projectId={clarityProjectId} />
        <MarketingPublicHeader liveDemoLinked={liveDemoLinked} />
        {children}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <MarketingPublicFooterDeferred />
      </div>
        <MarketingAnalyticsConsentBannerDeferred clarityProjectId={clarityProjectId} />
      </MarketingTooltipProvider>
    </ShellReadySurface>
  );
}
