import Link from "next/link";
import type { ReactNode } from "react";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = [
  { label: "Security", href: "/security-trust" },
  { label: "Privacy", href: "/privacy" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Trust Center", href: "/trust" },
  { label: "Sign in", href: "/auth/signin" },
] as const;

/** Shared public-site footer links for marketing trust surfaces. */
export function MarketingPublicFooter(): ReactNode {
  return (
    <footer
      className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800"
      data-testid="marketing-public-footer"
      aria-label="Site footer"
    >
      <nav aria-label="Public site links">
        <ul className={cn("m-0 flex flex-wrap gap-x-5 gap-y-2 p-0 list-none", MARKETING_TYPOGRAPHY.body)}>
          {FOOTER_LINKS.map((link) => (
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
