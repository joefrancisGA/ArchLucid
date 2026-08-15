"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { MarketingResourcesMenu } from "@/components/marketing/MarketingResourcesMenu";
import { Button } from "@/components/ui/button";
import { MARKETING_PUBLIC_NAV_LINK_CLASS } from "@/lib/marketing-public-nav-link-class";
import { appSiteHref } from "@/lib/site-urls";

type MarketingPublicHeaderProps = {
  readonly seeItLinked: boolean;
};

/**
 * Plain nav links (not Button/ghost): ghost `text-neutral-900` (#171717) fails axe on dark
 * `bg-al-surface-base` when dark: text utilities lose. Colors come from globals.css
 * `.marketing-public-nav-link` hex rules so contrast does not depend on Tailwind `dark:` merge.
 */
const MARKETING_NAV_LINK_CLASS = MARKETING_PUBLIC_NAV_LINK_CLASS;

function isSignupVerifyFocusRoute(pathname: string): boolean {
  return pathname === "/signup/verify";
}

export function MarketingPublicHeader(props: MarketingPublicHeaderProps): React.JSX.Element {
  const pathname = usePathname();
  const focusAuth = isSignupVerifyFocusRoute(pathname);

  return (
    <header
      data-marketing-public-header="true"
      className="sticky top-0 z-40 border-b border-neutral-200 bg-al-surface-raised shadow-sm print:hidden dark:border-neutral-800"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <ArchLucidWordmarkLink href="/welcome" aria-label="ArchLucid — welcome" variant="marketing" />
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
              <MarketingResourcesMenu seeItLinked={props.seeItLinked} />
            </nav>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {focusAuth ? null : (
            <Button asChild variant="outline" size="sm">
              <Link href={appSiteHref("/auth/signin")}>Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function MarketingPublicHeaderSlot(props: MarketingPublicHeaderProps & { readonly children?: ReactNode }): React.JSX.Element {
  void props.children;

  return <MarketingPublicHeader seeItLinked={props.seeItLinked} />;
}
