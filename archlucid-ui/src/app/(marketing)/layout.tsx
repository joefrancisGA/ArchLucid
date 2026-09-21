import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { resolveProductLineIdForServer } from "@/lib/product-line/resolve-product-line-id-server";
import {
  isMarketingRouteBlockedForProductLine,
  secureNowMarketingRedirectPath,
} from "@/lib/product-line/securenow-marketing-route-policy";

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
import { resolveSeeItDemoApiBase } from "@/app/(marketing)/see-it/load-see-it-demo-preview";
import { isMarketingSeeItLinkEnabled } from "@/lib/public-demo-mode";

export const metadata: Metadata = {
  title: "Welcome",
  description: "ArchLucid trial signup and product overview.",
};

/**
 * Public marketing chrome (no operator sidebar). Root `layout.tsx` still supplies global styles and color script.
 */
export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const productLine = await resolveProductLineIdForServer();

  if (isMarketingRouteBlockedForProductLine(productLine)) {
    redirect(secureNowMarketingRedirectPath());
  }

  const seeItLinked = isMarketingSeeItLinkEnabled() && resolveSeeItDemoApiBase().length > 0;
  const clarityProjectId = getMarketingClarityProjectId();

  return (
    <ShellReadySurface className={cn("min-h-screen", MARKETING_LAYOUT.page)}>
      <MarketingTooltipProvider>
        <MarketingFirstTouchCaptureDeferred />
        <MarketingJsonLd />
        <MicrosoftClarityLoaderDeferred projectId={clarityProjectId} />
        <MarketingPublicHeader seeItLinked={seeItLinked} />
        {children}
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <MarketingPublicFooterDeferred />
        </div>
        <MarketingAnalyticsConsentBannerDeferred clarityProjectId={clarityProjectId} />
      </MarketingTooltipProvider>
    </ShellReadySurface>
  );
}
