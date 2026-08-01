import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingAnalyticsConsentBanner } from "@/components/MarketingAnalyticsConsentBanner";
import { MarketingFirstTouchCapture } from "@/components/MarketingFirstTouchCapture";
import { MarketingJsonLd } from "@/components/MarketingJsonLd";
import { MarketingPublicFooter } from "@/components/marketing/MarketingPublicFooter";
import { MarketingPublicHeader } from "@/components/marketing/MarketingPublicHeader";
import { MicrosoftClarityLoader } from "@/components/MicrosoftClarityLoader";
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
      <MarketingFirstTouchCapture />
      <MarketingJsonLd />
      <MicrosoftClarityLoader projectId={clarityProjectId} />
      <MarketingPublicHeader liveDemoLinked={liveDemoLinked} />
      {children}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <MarketingPublicFooter />
      </div>
      <MarketingAnalyticsConsentBanner clarityProjectId={clarityProjectId} />
    </ShellReadySurface>
  );
}
