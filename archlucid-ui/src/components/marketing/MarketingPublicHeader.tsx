"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { MarketingResourcesMenu } from "@/components/marketing/MarketingResourcesMenu";
import { Button } from "@/components/ui/button";

type MarketingPublicHeaderProps = {
  readonly liveDemoLinked: boolean;
};

/** Literal neutrals — avoid text-al-text-primary so dark axe does not measure #171717 on #0a0a0a. */
const MARKETING_NAV_LINK_CLASS =
  "shrink-0 text-neutral-800 hover:text-neutral-950 dark:text-neutral-100 dark:hover:text-neutral-50";

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
    {/* Opaque raised surface (no /95 + blur): axe samples through translucent headers and reports base-surface contrast. */}
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-al-surface-raised shadow-sm print:hidden dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button variant="ghost" className="h-auto shrink-0 p-0" asChild>
            <ArchLucidWordmarkLink href="/welcome" aria-label="ArchLucid — welcome" variant="marketing" />
          </Button>
          {focusAuth ? null : (
            <nav
              aria-label="Marketing"
              className="-mx-1 flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto px-1 sm:flex-wrap sm:gap-1 sm:overflow-visible sm:pb-0 sm:pe-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <span className="sr-only">Product pages:</span>
              <Button asChild variant="ghost" size="sm" className={MARKETING_NAV_LINK_CLASS}>
                <Link href="/welcome">Overview</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className={MARKETING_NAV_LINK_CLASS}>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className={MARKETING_NAV_LINK_CLASS}>
                <Link href="/see-it">See it</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className={MARKETING_NAV_LINK_CLASS}>
                <Link href="/pricing#pricing-quote-request">Request demo</Link>
              </Button>
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
