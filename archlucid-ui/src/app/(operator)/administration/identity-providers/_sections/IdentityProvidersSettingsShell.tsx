"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  IDENTITY_PROVIDERS_NAV_DIAGNOSTICS,
  IDENTITY_PROVIDERS_NAV_OIDC,
  IDENTITY_PROVIDERS_NAV_OVERVIEW,
  IDENTITY_PROVIDERS_NAV_ROLE_MAPPING,
  IDENTITY_PROVIDERS_NAV_SAML,
  IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE,
  IDENTITY_PROVIDERS_PAGE_INTRO,
  IDENTITY_PROVIDERS_PAGE_TITLE,
  IDENTITY_PROVIDERS_SAFETY_NOTICE,
  identityProvidersPageSubtitle,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersNavId, IdentityProvidersOverviewModel } from "@/lib/identity-providers-settings-types";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { IdentityProvidersSettingsPageHeader } from "./IdentityProvidersSettingsPageHeader";
const NAV_ITEMS: ReadonlyArray<{ readonly id: IdentityProvidersNavId; readonly label: string; readonly href: string }> = [
  { id: "overview", label: IDENTITY_PROVIDERS_NAV_OVERVIEW, href: "/administration/identity-providers" },
  { id: "saml", label: IDENTITY_PROVIDERS_NAV_SAML, href: "/administration/identity-providers/saml" },
  { id: "oidc", label: IDENTITY_PROVIDERS_NAV_OIDC, href: "/administration/identity-providers/oidc" },
  { id: "role-mapping", label: IDENTITY_PROVIDERS_NAV_ROLE_MAPPING, href: "/administration/identity-providers/role-mapping" },
  { id: "diagnostics", label: IDENTITY_PROVIDERS_NAV_DIAGNOSTICS, href: "/administration/identity-providers/diagnostics" },
];

function resolveActiveNavId(pathname: string): IdentityProvidersNavId {
  if (pathname.startsWith("/administration/identity-providers/saml")) {
    return "saml";
  }

  if (pathname.startsWith("/administration/identity-providers/oidc")) {
    return "oidc";
  }

  if (pathname.startsWith("/administration/identity-providers/role-mapping")) {
    return "role-mapping";
  }

  if (pathname.startsWith("/administration/identity-providers/diagnostics")) {
    return "diagnostics";
  }

  return "overview";
}

function resolveHeaderStatusLabel(
  activeNavId: IdentityProvidersNavId,
  overview: IdentityProvidersOverviewModel | undefined,
): IdentityProvidersOverviewModel["oidcStatus"] | undefined {
  if (overview === undefined) {
    return undefined;
  }

  switch (activeNavId) {
    case "saml":
      return overview.samlStatus;
    case "oidc":
      return overview.oidcStatus;
    case "role-mapping":
      return overview.roleMappingStatus;
    case "diagnostics":
      return overview.ssoStatus;
    case "overview":
      return overview.ssoStatus;
    default: {
      const _exhaustive: never = activeNavId;

      return _exhaustive;
    }
  }
}

export type IdentityProvidersSettingsShellProps = {
  readonly pageTitle?: string;
  readonly pageSubtitle?: string;
  readonly pageIntro?: string;
  readonly overview?: IdentityProvidersOverviewModel;
  readonly statusBadgeReady?: boolean;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly diagnosticsDataUnavailable?: boolean;
  readonly showAdminFallbackNotice?: boolean;
  readonly headerBreadcrumb?: React.ReactNode;
  readonly primaryContentId?: string;
  readonly skipLinkLabel?: string;
  readonly onRefresh: () => void;
  readonly children: React.ReactNode;
};

export function IdentityProvidersSettingsShell(props: IdentityProvidersSettingsShellProps): React.JSX.Element {
  const pathname = usePathname();
  const activeNavId = resolveActiveNavId(pathname);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const resolvedTitle = props.pageTitle ?? IDENTITY_PROVIDERS_PAGE_TITLE;
  const isOverviewPage = resolvedTitle === IDENTITY_PROVIDERS_PAGE_TITLE;
  const headerSubtitle =
    props.pageSubtitle ??
    (isOverviewPage
      ? identityProvidersPageSubtitle(buyerPolishedShell)
      : (props.pageIntro ?? IDENTITY_PROVIDERS_PAGE_INTRO));

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="identity-providers-settings-shell">
      {props.skipLinkLabel !== undefined && props.primaryContentId !== undefined ? (
        <a href={`#${props.primaryContentId}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {props.skipLinkLabel}
        </a>
      ) : null}

      <div
        id={props.primaryContentId}
        data-testid={
          props.primaryContentId !== undefined ? "identity-providers-settings-primary-content" : undefined
        }
        className={props.primaryContentId !== undefined ? cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack) : OPERATOR_LAYOUT.sectionStack}
      >
        <IdentityProvidersSettingsPageHeader
          pageTitle={resolvedTitle}
          subtitle={headerSubtitle}
          breadcrumb={props.headerBreadcrumb}
        statusLabel={
          props.statusBadgeReady === false
            || props.diagnosticsDataUnavailable === true
            || props.overview?.headerStatusAvailable === false
            ? undefined
            : resolveHeaderStatusLabel(activeNavId, props.overview)
        }
        refreshing={props.refreshing}
        lastRefreshedAt={props.lastRefreshedAt}
        diagnosticsDataUnavailable={props.diagnosticsDataUnavailable}
        onRefresh={props.onRefresh}
      />

      {isOverviewPage ? (
        <div className="space-y-2">
          {!buyerPolishedShell ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {IDENTITY_PROVIDERS_PAGE_INTRO}
            </p>
          ) : null}
          <p
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="identity-providers-safety-notice"
          >
            {IDENTITY_PROVIDERS_SAFETY_NOTICE}
          </p>
        </div>
      ) : null}

      {props.showAdminFallbackNotice === true ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="identity-providers-admin-fallback-notice"
        >
          {IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE}
        </p>
      ) : null}

      <nav aria-label="Identity provider sections" data-testid="identity-providers-settings-nav">
        <ul className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const active = item.id === activeNavId;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  prefetch={false}
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
    </OperatorPageContainer>
  );
}
