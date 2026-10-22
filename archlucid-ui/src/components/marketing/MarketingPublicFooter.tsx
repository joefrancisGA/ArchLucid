"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ASSURANCE_STATUS_PUBLIC_LABEL,
  ASSURANCE_STATUS_PUBLIC_PATH,
  PRIVACY_POLICY_PUBLIC_LABEL,
  PRIVACY_POLICY_PUBLIC_PATH,
  TRUST_CENTER_PUBLIC_LABEL,
  TRUST_CENTER_PUBLIC_PATH,
} from "@/lib/marketing-assurance-public-labels";
import { appSiteHref } from "@/lib/site-urls";
import { cn } from "@/lib/utils";

function marketingPublicFooterLinks(): readonly { readonly label: string; readonly href: string }[] {
  return [
    { label: TRUST_CENTER_PUBLIC_LABEL, href: TRUST_CENTER_PUBLIC_PATH },
    { label: ASSURANCE_STATUS_PUBLIC_LABEL, href: ASSURANCE_STATUS_PUBLIC_PATH },
    { label: PRIVACY_POLICY_PUBLIC_LABEL, href: PRIVACY_POLICY_PUBLIC_PATH },
    { label: "Product FAQ", href: "/faq" },
    { label: "Sign in", href: appSiteHref("/auth/signin") },
  ];
}

function shouldExcludeFooterLink(pathname: string, href: string, excluded: ReadonlySet<string>): boolean {
  if (excluded.has(href)) {
    return true;
  }

  if (href === appSiteHref("/auth/signin") && excluded.has("/auth/signin")) {
    return true;
  }

  // Signup already exposes Sign in in the sticky header — do not triple it in the footer.
  if (
    href === appSiteHref("/auth/signin") &&
    (pathname === "/signup" || pathname.startsWith("/signup/"))
  ) {
    return true;
  }

  if (!href.startsWith("/")) {
    return false;
  }

  if (pathname === href) {
    return true;
  }

  if (pathname.startsWith(`${href}/`)) {
    return true;
  }

  return false;
}

type MarketingPublicFooterProps = {
  readonly excludeHrefs?: readonly string[];
};

/** Shared public-site footer links for marketing trust surfaces. */
export function MarketingPublicFooter(props: MarketingPublicFooterProps = {}): ReactNode {
  const pathname = usePathname() ?? "";
  const excluded = new Set(props.excludeHrefs ?? []);
  const links = marketingPublicFooterLinks().filter(
    (link) => !shouldExcludeFooterLink(pathname, link.href, excluded),
  );

  return (
    <footer
      className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800"
      data-testid="marketing-public-footer"
      aria-label="Site footer"
    >
      <nav aria-label="Public site links">
        <ul className={cn("m-0 flex flex-wrap gap-x-5 gap-y-2 p-0 list-none", MARKETING_TYPOGRAPHY.body)}>
          {links.map((link) => (
            <li key={link.href}>
              <Link className={MARKETING_SURFACES.inlineLink} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p
        className={cn("mt-6 m-0 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}
        data-testid="marketing-public-footer-copyright"
      >
        © {new Date().getFullYear()} Francis Architecture, LLC. All rights reserved.
      </p>
    </footer>
  );
}
