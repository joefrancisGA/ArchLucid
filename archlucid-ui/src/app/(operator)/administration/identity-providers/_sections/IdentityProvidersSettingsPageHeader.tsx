"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  PAGE_HELP_SHORT_TRIGGER_TEXT,
  PageContextualHelpButton,
} from "@/components/usability/PageContextualHelpButton";
import { resolveAuthDomainsCurrentWorkspaceLabel } from "@/lib/auth-domains-page-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { identityProviderCustomerStatusPresentation } from "@/lib/identity-provider-probe-status-presentation";
import {
  IDENTITY_PROVIDERS_ACTION_REFRESHING,
  IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF,
  IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_LABEL,
  IDENTITY_PROVIDERS_LAST_REFRESHED_PREFIX,
  IDENTITY_PROVIDERS_PAGE_TITLE,
  identityProvidersTenantScopeLine,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProviderCustomerStatus } from "@/lib/identity-providers-settings-types";
import {
  operatorFreshnessMetadataWithClockLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

export type IdentityProvidersSettingsPageHeaderProps = {
  readonly pageTitle?: string;
  readonly subtitle: string;
  readonly breadcrumb?: React.ReactNode;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly diagnosticsDataUnavailable?: boolean;
  readonly statusLabel?: IdentityProviderCustomerStatus;
  readonly onRefresh: () => void;
};

/** Shared identity-provider settings hero — title, lead, contextual help, refresh, and diagnostics shortcut. */
export function IdentityProvidersSettingsPageHeader(
  props: IdentityProvidersSettingsPageHeaderProps,
): React.JSX.Element {
  const pathname = usePathname();
  const pageTitle = props.pageTitle ?? IDENTITY_PROVIDERS_PAGE_TITLE;
  const onOverviewPage = pageTitle === IDENTITY_PROVIDERS_PAGE_TITLE;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showContextualHelp = !(buyerPolishedShell && !onOverviewPage);
  const onDiagnosticsPage = pathname.startsWith(IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF);
  const onOidcPage = pathname.startsWith("/administration/identity-providers/oidc");
  const onSamlPage = pathname.startsWith("/administration/identity-providers/saml");
  const showDiagnosticsLink = !onDiagnosticsPage && !onOidcPage;
  const showTenantScopeMetadata = !onSamlPage;
  const [currentWorkspaceLabel, setCurrentWorkspaceLabel] = useState<string | null>(null);
  const tenantScopeLine = identityProvidersTenantScopeLine(currentWorkspaceLabel);
  const statusPresentation =
    props.statusLabel !== undefined
      ? identityProviderCustomerStatusPresentation(props.statusLabel)
      : null;
  const freshnessLabel = props.diagnosticsDataUnavailable === true
    ? "Data unavailable"
    : props.refreshing
      ? IDENTITY_PROVIDERS_ACTION_REFRESHING
      : operatorFreshnessMetadataWithClockLabel({
          prefix: IDENTITY_PROVIDERS_LAST_REFRESHED_PREFIX,
          lastRefreshedAt: props.lastRefreshedAt,
          refreshingLabel: null,
        });

  useEffect(() => {
    setCurrentWorkspaceLabel(resolveAuthDomainsCurrentWorkspaceLabel(readOperatorScopeFromStorage()));
  }, []);

  return (
    <OperatorPageHeader
      navHref="/administration/identity-providers"
      title={pageTitle}
      titleTestId="identity-providers-page-title"
      subtitle={props.subtitle}
      breadcrumb={props.breadcrumb}
      statusBadge={
        statusPresentation !== null ? (
          <StatusTag
            kind={statusPresentation.kind}
            label={statusPresentation.label}
            data-testid="identity-providers-header-status-badge"
          />
        ) : null
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="identity-providers-header-actions">
          {showContextualHelp ? (
            <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          ) : null}
          <RefreshButton
            busy={props.refreshing}
            data-testid="identity-providers-refresh-button"
            onClick={() => void props.onRefresh()}
          />
          {showDiagnosticsLink ? (
            <Link
              href={IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF}
              className={OPERATOR_LINK.optional}
              data-testid="identity-providers-diagnostics-link"
            >
              {IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_LABEL}
            </Link>
          ) : null}
        </div>
      }
      metadata={
        <>
          {showTenantScopeMetadata ? (
            <span
              className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="identity-providers-tenant-scope"
            >
              {tenantScopeLine}
            </span>
          ) : null}
          <OperatorPageFreshnessMetadata
            testId="identity-providers-last-refreshed"
            lastRefreshedAt={
              props.diagnosticsDataUnavailable === true || props.refreshing
                ? null
                : props.lastRefreshedAt
            }
          >
            {freshnessLabel}
          </OperatorPageFreshnessMetadata>
        </>
      }
    />
  );
}
