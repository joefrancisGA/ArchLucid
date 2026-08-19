"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { RoleMappingSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { fetchTenantIdentityProviderConfiguration } from "@/lib/admin-identity-provider-api";
import type { TenantIdentityProviderConfigurationRecord } from "@/lib/admin-identity-provider-api";
import { resolveAuthDomainsCurrentWorkspaceLabel } from "@/lib/auth-domains-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { canViewIdentityProviderTechnicalDiagnostics } from "@/lib/resolve-identity-providers-overview";
import { resolveRoleMappingPrimaryCta } from "@/lib/role-mapping-page-cta";
import { extractPersistedTenantRoleMappingRows } from "@/lib/saml-sp-configuration-form-state";
import {
  IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE,
  IDENTITY_PROVIDERS_OVERVIEW_RELATED_SURFACES_TITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EMPTY_STATE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_HELPER,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL,
  IDENTITY_PROVIDERS_ROLE_MAPPING_LOAD_ERROR,
  IDENTITY_PROVIDERS_ROLE_MAPPING_LOADING,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_TEST_TOKEN,
  IDENTITY_PROVIDERS_ROLE_MAPPING_TABLE_TITLE,
  IDENTITY_PROVIDERS_SAFETY_NOTICE,
  IDENTITY_PROVIDERS_TEST_BEFORE_ENABLE_NOTICE,
  identityProvidersRoleMappingPageSubtitle,
  identityProvidersTenantScopeLine,
} from "@/lib/identity-providers-settings-copy";
import { readOperatorScopeFromStorage, ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";

import { AuthTokenTestMappingCard } from "./AuthTokenTestMappingCard";
import { IdentityProviderSetupChecklist } from "./IdentityProviderSetupChecklist";
import { IdentityProvidersRoleMappingBreadcrumb } from "./IdentityProvidersRoleMappingBreadcrumb";
import { IdentityProvidersRoleMappingBuyerChrome } from "./IdentityProvidersRoleMappingBuyerChrome";
import { IdentityProvidersRoleMappingLoadingSkeleton } from "./IdentityProvidersRoleMappingLoadingSkeleton";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import {
  ROLE_MAPPING_SETTINGS_LOAD_ERROR_RETRY_LABEL,
  ROLE_MAPPING_SETTINGS_PRIMARY_CONTENT_ID,
  ROLE_MAPPING_SETTINGS_SKIP_LINK_LABEL,
} from "./role-mapping-settings-page-copy";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersRoleMappingPageViewProps = {
  readonly model: UseIdentityProvidersSettingsPageModel;
};

function resolveIdentitySourceLabel(
  config: UseIdentityProvidersSettingsPageModel["authConfigurationDiagnostics"],
): string {
  if (config?.tenantIdentityProviderProtocol === "Saml") {
    return "SAML tenant configuration";
  }

  if (config?.authMode === "JwtBearer") {
    return "OIDC/JWT claims";
  }

  return "Not configured";
}

export function IdentityProvidersRoleMappingPageView(
  props: IdentityProvidersRoleMappingPageViewProps,
): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [tenantConfig, setTenantConfig] = useState<TenantIdentityProviderConfigurationRecord | null>(null);
  const [tenantConfigLoaded, setTenantConfigLoaded] = useState(false);
  const [tenantConfigLoadFailed, setTenantConfigLoadFailed] = useState(false);
  const [currentWorkspaceLabel, setCurrentWorkspaceLabel] = useState<string | null>(null);

  const identitySource = resolveIdentitySourceLabel(props.model.authConfigurationDiagnostics);
  const claimSource = props.model.authConfigurationDiagnostics?.roleClaimNameConfigured === true
    ? "Configured"
    : "Not configured";
  const configLoaded = props.model.authConfigurationDiagnosticsLoaded;
  const primaryCta = resolveRoleMappingPrimaryCta(props.model.authConfigurationDiagnostics);
  const mappingRows = extractPersistedTenantRoleMappingRows(tenantConfig);
  const showTechnicalDetails = canViewIdentityProviderTechnicalDiagnostics(isArchLucidInternalOperatorShellEnv());

  const loadTenantConfig = useCallback(async () => {
    setTenantConfigLoaded(false);
    setTenantConfigLoadFailed(false);

    try {
      const record = await fetchTenantIdentityProviderConfiguration();
      setTenantConfig(record);
      setTenantConfigLoadFailed(false);
    } catch {
      setTenantConfig(null);
      setTenantConfigLoadFailed(true);
    } finally {
      setTenantConfigLoaded(true);
    }
  }, []);

  const syncWorkspaceLabel = useCallback(() => {
    setCurrentWorkspaceLabel(resolveAuthDomainsCurrentWorkspaceLabel(readOperatorScopeFromStorage()));
  }, []);

  useEffect(() => {
    syncWorkspaceLabel();
  }, [syncWorkspaceLabel]);

  useEffect(() => {
    void loadTenantConfig();
  }, [loadTenantConfig]);

  useEffect(() => {
    const onScopeChanged = () => {
      syncWorkspaceLabel();
      void loadTenantConfig();
    };

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);
    };
  }, [loadTenantConfig, syncWorkspaceLabel]);

  const handleRefresh = useCallback(async () => {
    await props.model.refresh();
    await loadTenantConfig();
  }, [loadTenantConfig, props.model]);

  return (
    <IdentityProvidersSettingsShell
      pageTitle={IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE}
      pageSubtitle={identityProvidersRoleMappingPageSubtitle(buyerPolishedShell)}
      overview={props.model.overview}
      statusBadgeReady={props.model.dataLoaded}
      refreshing={props.model.refreshing}
      lastRefreshedAt={props.model.lastRefreshedAt}
      diagnosticsDataUnavailable={props.model.diagnosticsDataUnavailable}
      headerBreadcrumb={buyerPolishedShell ? <IdentityProvidersRoleMappingBreadcrumb /> : undefined}
      primaryContentId={buyerPolishedShell ? ROLE_MAPPING_SETTINGS_PRIMARY_CONTENT_ID : undefined}
      skipLinkLabel={buyerPolishedShell ? ROLE_MAPPING_SETTINGS_SKIP_LINK_LABEL : undefined}
      onRefresh={() => void handleRefresh()}
    >
      {buyerPolishedShell ? <IdentityProvidersRoleMappingBuyerChrome /> : (
        <RoleMappingSettingsEvidenceOrientationStrip />
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-start">
        <div className="space-y-4">
          <div
            className={cn(
              "space-y-2 rounded-md border border-neutral-200 px-3 py-2 text-al-text-primary dark:border-neutral-800",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="identity-providers-role-mapping-scope-notice"
          >
            {!buyerPolishedShell ? (
              <p className="m-0 text-al-text-secondary" data-testid="identity-providers-role-mapping-tenant-scope">
                {identityProvidersTenantScopeLine(currentWorkspaceLabel)}
              </p>
            ) : null}
            <p className="m-0" data-testid="identity-providers-safety-notice">
              {IDENTITY_PROVIDERS_SAFETY_NOTICE}
            </p>
            <p className="m-0 text-al-text-secondary" data-testid="identity-providers-admin-fallback-notice">
              {IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE}
            </p>
          </div>

          <Card data-testid="identity-providers-role-mapping-status">
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Role mapping status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!configLoaded ? (
                <IdentityProvidersRoleMappingLoadingSkeleton />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={primaryCta.href} data-testid="identity-providers-role-mapping-primary-cta">
                        {primaryCta.label}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href="#auth-token-test-mapping-card"
                        data-testid="identity-providers-role-mapping-diagnostics-cta"
                      >
                        {IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_TEST_TOKEN}
                      </Link>
                    </Button>
                  </div>

                  <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
                    <div>
                      <dt className="text-al-text-secondary">Identity source</dt>
                      <dd className="m-0 mt-1 font-medium text-al-text-primary">{identitySource}</dd>
                    </div>
                    <div>
                      <dt className="text-al-text-secondary">Claim / group source</dt>
                      <dd className="m-0 mt-1 font-medium text-al-text-primary">{claimSource}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-al-text-secondary">Default role behavior</dt>
                      <dd className="m-0 mt-1 text-al-text-primary">
                        Unmapped users do not receive elevated workspace roles until a matching group or claim is mapped.
                      </dd>
                    </div>
                  </dl>

                  <div className="space-y-2">
                    <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {IDENTITY_PROVIDERS_ROLE_MAPPING_TABLE_TITLE}
                    </p>
                    {!tenantConfigLoaded ? (
                      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {IDENTITY_PROVIDERS_ROLE_MAPPING_LOADING}
                      </p>
                    ) : tenantConfigLoadFailed ? (
                      <div className="space-y-2" data-testid="identity-providers-role-mapping-load-error">
                        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                          {IDENTITY_PROVIDERS_ROLE_MAPPING_LOAD_ERROR}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="identity-providers-role-mapping-load-retry"
                          onClick={() => void loadTenantConfig()}
                        >
                          {ROLE_MAPPING_SETTINGS_LOAD_ERROR_RETRY_LABEL}
                        </Button>
                      </div>
                    ) : mappingRows.length > 0 ? (
                      <EnterpriseTable
                        ariaLabel={IDENTITY_PROVIDERS_ROLE_MAPPING_TABLE_TITLE}
                        data-testid="identity-providers-role-mapping-table"
                      >
                        <EnterpriseTableHead>
                          <EnterpriseTableHeadRow>
                            <EnterpriseTableHeaderCell>IdP group or claim value</EnterpriseTableHeaderCell>
                            <EnterpriseTableHeaderCell>ArchLucid role</EnterpriseTableHeaderCell>
                          </EnterpriseTableHeadRow>
                        </EnterpriseTableHead>
                        <EnterpriseTableBody>
                          {mappingRows.map((row) => (
                            <EnterpriseTableRow key={`${row.idpValue}-${row.archLucidRole}`}>
                              <EnterpriseTableCell>{row.idpValue}</EnterpriseTableCell>
                              <EnterpriseTableCell>{row.archLucidRole}</EnterpriseTableCell>
                            </EnterpriseTableRow>
                          ))}
                        </EnterpriseTableBody>
                      </EnterpriseTable>
                    ) : (
                      <p
                        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                        data-testid="identity-providers-role-mapping-empty"
                      >
                        {IDENTITY_PROVIDERS_ROLE_MAPPING_EMPTY_STATE}
                      </p>
                    )}
                  </div>

                  <details
                    className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                    data-testid="identity-providers-role-mapping-examples-disclosure"
                  >
                    <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                      {IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL}
                    </summary>
                    <div className="mt-2 space-y-2">
                      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_HELPER}
                      </p>
                      <ul
                        className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                        data-testid="identity-providers-role-mapping-examples"
                      >
                        {IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES.map((example) => (
                          <li key={example.archLucidRole}>
                            {example.idpValue} → {example.archLucidRole}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>

                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {IDENTITY_PROVIDERS_TEST_BEFORE_ENABLE_NOTICE}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {configLoaded ? <AuthTokenTestMappingCard showTechnicalDetails={false} /> : null}
        </div>

        <aside className="space-y-4">
          {props.model.authConfigurationDiagnosticsLoaded ? (
            <IdentityProviderSetupChecklist
              configDiagnostics={props.model.authConfigurationDiagnostics}
              configDiagnosticsNote={props.model.authConfigurationDiagnosticsNote}
              samlOperationalHealth={props.model.samlOperationalHealth}
              showTechnicalDetails={showTechnicalDetails}
            />
          ) : null}

          <Card data-testid="identity-providers-role-mapping-related-surfaces">
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
                {IDENTITY_PROVIDERS_OVERVIEW_RELATED_SURFACES_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body)}>
              <p className="m-0">
                <Link href="/administration/users" className={OPERATOR_LINK.nav}>
                  Users and roles
                </Link>
              </p>
              <p className="m-0">
                <Link href="/administration/identity-providers/saml" className={OPERATOR_LINK.nav}>
                  SAML configuration
                </Link>
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </IdentityProvidersSettingsShell>
  );
}
