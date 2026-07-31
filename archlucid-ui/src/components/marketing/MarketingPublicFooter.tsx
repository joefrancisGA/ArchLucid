import Link from "next/link";
import type { ReactNode } from "react";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { appSiteHref } from "@/lib/site-urls";
import { cn } from "@/lib/utils";

function marketingPublicFooterLinks(): readonly { readonly label: string; readonly href: string }[] {
  return [
    { label: "Security", href: "/security-trust" },
    { label: "Privacy", href: "/privacy" },
    { label: "Product FAQ", href: "/faq" },
    { label: "Trust Center", href: "/trust" },
    { label: "Sign in", href: appSiteHref("/auth/signin") },
  ];
}

type MarketingPublicFooterProps = {
  readonly excludeHrefs?: readonly string[];
};

/** Shared public-site footer links for marketing trust surfaces. */
export function MarketingPublicFooter(props: MarketingPublicFooterProps = {}): ReactNode {
  const excluded = new Set(props.excludeHrefs ?? []);
  const links = marketingPublicFooterLinks().filter(
    (link) => !excluded.has(link.href) && !excluded.has("/auth/signin"),
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
    </footer>
  );
}
