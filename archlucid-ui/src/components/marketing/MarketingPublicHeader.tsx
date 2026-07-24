"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { MarketingResourcesMenu } from "@/components/marketing/MarketingResourcesMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarketingPublicHeaderProps = {
  readonly liveDemoLinked: boolean;
};

/**
 * Plain nav links (not Button/ghost): ghost `text-neutral-900` (#171717) fails axe on dark
 * `bg-al-surface-base` when dark: text utilities lose. Colors come from globals.css
 * `.marketing-public-nav-link` hex rules so contrast does not depend on Tailwind `dark:` merge.
 */
const MARKETING_NAV_LINK_CLASS = cn(
  "marketing-public-nav-link inline-flex h-7 shrink-0 items-center justify-center rounded-md px-3 text-xs font-semibold",
  "transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:hover:bg-neutral-800",
);

function shouldHideThemeToggleOnMarketingRoute(pathname: string): boolean {
  return (
    pathname === "/pricing" ||
    pathname.startsWith("/pricing/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/faq" ||
    pathname.startsWith("/faq/")
  );
}

function isSignupVerifyFocusRoute(pathname: string): boolean {
  return pathname === "/signup/verify";
}

export function MarketingPublicHeader(props: MarketingPublicHeaderProps): React.JSX.Element {
  const pathname = usePathname();
  const hideThemeToggle = shouldHideThemeToggleOnMarketingRoute(pathname);
  const focusAuth = isSignupVerifyFocusRoute(pathname);

  return (
    <header
      data-marketing-public-header="true"
      className="sticky top-0 z-40 border-b border-neutral-200 bg-al-surface-raised shadow-sm print:hidden dark:border-neutral-800"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button variant="ghost" className="h-auto shrink-0 p-0" asChild>
            <ArchLucidWordmarkLink href="/welcome" aria-label="ArchLucid — welcome" variant="marketing" />
          </Button>
          {focusAuth ? null : (
            <nav
              aria-label="Marketing"
              tabIndex={0}
              className="-mx-1 flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto px-1 sm:flex-wrap sm:gap-1 sm:overflow-visible sm:pb-0 sm:pe-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <span className="sr-only">Product pages:</span>
              <Link className={MARKETING_NAV_LINK_CLASS} href="/welcome">
                Overview
              </Link>
              <Link className={MARKETING_NAV_LINK_CLASS} href="/pricing">
                Pricing
              </Link>
              <Link className={MARKETING_NAV_LINK_CLASS} href="/see-it">
                See it
              </Link>
              <Link className={MARKETING_NAV_LINK_CLASS} href="/pricing#pricing-quote-request">
                Request demo
              </Link>
              <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-neutral-200 dark:bg-neutral-700 sm:block" aria-hidden />
              <MarketingResourcesMenu liveDemoLinked={props.liveDemoLinked} />
            </nav>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {hideThemeToggle || focusAuth ? null : <ColorModeToggle />}
          {focusAuth ? null : (
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function MarketingPublicHeaderSlot(props: MarketingPublicHeaderProps & { readonly children?: ReactNode }): React.JSX.Element {
  void props.children;

  return <MarketingPublicHeader liveDemoLinked={props.liveDemoLinked} />;
}
