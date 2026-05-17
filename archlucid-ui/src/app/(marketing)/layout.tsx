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
                <Link href="/see-it">See it</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/pricing#pricing-quote-request">Request demo</Link>
              </Button>
              <span
                className="mx-0.5 hidden h-5 w-px shrink-0 bg-neutral-200 dark:bg-neutral-700 sm:block"
                aria-hidden
              />
              <details className="group relative shrink-0 [&_summary::-webkit-details-marker]:hidden">
                <summary className="inline-flex list-none cursor-pointer items-center rounded-md px-2 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800">
                  Resources
                  <span className="ml-0.5 text-neutral-400" aria-hidden>
                    ▾
                  </span>
                </summary>
                <div className="absolute end-0 top-full z-50 mt-1 min-w-[14rem] rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-950">
                  <Link
                    href="/compliance-journey"
                    className="block px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >
                    Compliance journey
                  </Link>
                  <Link
                    href="/trust"
                    className="block px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >
                    Trust Center
                  </Link>
                  <Link
                    href="/security-trust"
                    className="block px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >
                    Security &amp; assurance
                  </Link>
                  <Link
                    href="/privacy"
                    className="block px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/why"
                    className="block px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  >
                    Why ArchLucid
                  </Link>
                  {liveDemoLinked ? (
                    <Link
                      href="/live-demo"
                      className="block px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                    >
                      Live demo
                    </Link>
                  ) : null}
                </div>
              </details>
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
