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
      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button variant="ghost" className="h-auto shrink-0 p-0" asChild>
              <ArchLucidWordmarkLink href="/welcome" aria-label="ArchLucid — welcome" variant="marketing" />
            </Button>
            <nav
              aria-label="Marketing"
              className="hidden min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex"
            >
              <Button asChild variant="ghost" size="sm">
                <Link href="/welcome">Overview</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/signup">Start free trial</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/why">Why ArchLucid</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/see-it">See it (30s)</Link>
              </Button>
              {liveDemoLinked ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/live-demo">Live demo</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm">
                <Link href="/compliance-journey">Compliance journey</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/trust">Trust Center</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/privacy">Privacy</Link>
              </Button>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
