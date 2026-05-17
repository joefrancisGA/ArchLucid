import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { MarketingAnalyticsConsentBanner } from "@/components/MarketingAnalyticsConsentBanner";
import { MarketingJsonLd } from "@/components/MarketingJsonLd";
import { MicrosoftClarityLoader } from "@/components/MicrosoftClarityLoader";
import { ShellReadySurface } from "@/components/ShellReadySurface";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { Button } from "@/components/ui/button";
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
    <ShellReadySurface className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <MarketingJsonLd />
      <MicrosoftClarityLoader projectId={clarityProjectId} />
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Button variant="ghost" className="h-auto shrink-0 p-0" asChild>
              <ArchLucidWordmarkLink href="/welcome" aria-label="ArchLucid — welcome" variant="marketing" />
            </Button>
            <nav
              aria-label="Marketing"
              className="-mx-1 flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto px-1 sm:flex-wrap sm:gap-1 sm:overflow-visible sm:pb-0 sm:pe-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <span className="sr-only">Product pages:</span>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/welcome">Overview</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/why">Why ArchLucid</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/see-it">See it (30s)</Link>
              </Button>
              {liveDemoLinked ? (
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <Link href="/live-demo">Live demo</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/pricing#pricing-quote-request">Request demo</Link>
              </Button>
              <span
                className="mx-0.5 hidden h-5 w-px shrink-0 bg-neutral-200 dark:bg-neutral-700 sm:block"
                aria-hidden
              />
              <span className="sr-only">Trust and policies:</span>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/compliance-journey">Compliance journey</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/trust">Trust Center</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/privacy">Privacy</Link>
              </Button>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ColorModeToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
      <MarketingAnalyticsConsentBanner clarityProjectId={clarityProjectId} />
    </ShellReadySurface>
  );
}
