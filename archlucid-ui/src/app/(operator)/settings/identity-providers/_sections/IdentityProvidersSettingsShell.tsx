"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  IDENTITY_PROVIDERS_NAV_DIAGNOSTICS,
  IDENTITY_PROVIDERS_NAV_OIDC,
  IDENTITY_PROVIDERS_NAV_OVERVIEW,
  IDENTITY_PROVIDERS_NAV_ROLE_MAPPING,
  IDENTITY_PROVIDERS_NAV_SAML,
  IDENTITY_PROVIDERS_PAGE_INTRO,
  IDENTITY_PROVIDERS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_PAGE_TITLE,
  IDENTITY_PROVIDERS_SAFETY_NOTICE,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersNavId } from "@/lib/identity-providers-settings-types";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const NAV_ITEMS: ReadonlyArray<{ readonly id: IdentityProvidersNavId; readonly label: string; readonly href: string }> = [
  { id: "overview", label: IDENTITY_PROVIDERS_NAV_OVERVIEW, href: "/settings/identity-providers" },
  { id: "saml", label: IDENTITY_PROVIDERS_NAV_SAML, href: "/settings/identity-providers/saml" },
  { id: "oidc", label: IDENTITY_PROVIDERS_NAV_OIDC, href: "/settings/identity-providers/oidc" },
  { id: "role-mapping", label: IDENTITY_PROVIDERS_NAV_ROLE_MAPPING, href: "/settings/identity-providers/role-mapping" },
  { id: "diagnostics", label: IDENTITY_PROVIDERS_NAV_DIAGNOSTICS, href: "/settings/identity-providers/diagnostics" },
];

function resolveActiveNavId(pathname: string): IdentityProvidersNavId {
  if (pathname.startsWith("/settings/identity-providers/saml")) {
    return "saml";
  }

  if (pathname.startsWith("/settings/identity-providers/oidc")) {
    return "oidc";
  }

  if (pathname.startsWith("/settings/identity-providers/role-mapping")) {
    return "role-mapping";
  }

  if (pathname.startsWith("/settings/identity-providers/diagnostics")) {
    return "diagnostics";
  }

  return "overview";
}

export type IdentityProvidersSettingsShellProps = {
  readonly pageTitle?: string;
  readonly pageIntro?: string;
  readonly children: React.ReactNode;
};

export function IdentityProvidersSettingsShell(props: IdentityProvidersSettingsShellProps): React.JSX.Element {
  const pathname = usePathname();
  const activeNavId = resolveActiveNavId(pathname);
  const pageTitle = props.pageTitle ?? IDENTITY_PROVIDERS_PAGE_TITLE;
  const pageIntro = props.pageIntro ?? IDENTITY_PROVIDERS_PAGE_INTRO;

  return (
    <div className="w-full max-w-4xl space-y-6" data-testid="identity-providers-settings-shell">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="h-8 px-0 text-teal-800 dark:text-teal-300">
          <Link href="/settings#settings-section-advanced">← Settings</Link>
        </Button>
        <div>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{pageTitle}</h1>
          <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {IDENTITY_PROVIDERS_PAGE_SUBTITLE}
          </p>
          <p className={cn("mt-2 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{pageIntro}</p>
          <p className={cn("mt-2 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {IDENTITY_PROVIDERS_SAFETY_NOTICE}
          </p>
        </div>
      </header>

      <nav aria-label="Identity provider sections" data-testid="identity-providers-settings-nav">
        <ul className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const active = item.id === activeNavId;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-[30px] items-center rounded-full border px-3 py-1 transition-colors",
                    OPERATOR_TYPOGRAPHY.badge,
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                      : cn("border-neutral-300 text-al-text-primary hover:border-neutral-400 dark:border-neutral-700", OPERATOR_LINK.nav),
                  )}
                  data-testid={`identity-providers-nav-${item.id}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {props.children}
    </div>
  );
}
