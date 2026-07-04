"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

import { IdentityProviderSetupChecklist } from "./IdentityProviderSetupChecklist";
import { IdentityProviderHealthStrip } from "./IdentityProviderHealthStrip";
import { AuthTokenTestMappingCard } from "./AuthTokenTestMappingCard";
import { OidcDiagnosticsStrip } from "./OidcDiagnosticsStrip";
import { SamlOperationalHealthStrip } from "./SamlOperationalHealthStrip";
import { SamlSpConfigurationForm } from "./SamlSpConfigurationForm";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersSettingsPageViewProps = {
  model: UseIdentityProvidersSettingsPageModel;
};

export function IdentityProvidersSettingsPageView({ model }: IdentityProvidersSettingsPageViewProps) {
  const {
    note,
    rows,
    identityProviderDiagnostics,
    identityProviderDiagnosticsNote,
    identityProviderDiagnosticsLoaded,
    authConfigurationDiagnostics,
    authConfigurationDiagnosticsNote,
    authConfigurationDiagnosticsLoaded,
    oidcDiagnostics,
    oidcDiagnosticsNote,
    oidcDiagnosticsLoaded,
    samlOperationalHealth,
    samlOperationalHealthNote,
    samlOperationalHealthLoaded,
  } = model;

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Identity providers</h1>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
          Read-only view of <strong className="font-medium text-al-text-primary">ArchLucidAuth</strong>{" "}
          catalog rows (authority, audience, mode). Effective values are masked server-side — configure secrets only in
          your hosting environment or Key Vault, not in this UI. For guided tenant SSO setup, use the{" "}
          <a href="/settings/identity/sso-wizard" className={OPERATOR_LINK.inline}>
            SSO configuration wizard
          </a>
          . For SAML claim-mapping tables (Entra, Okta, Ping) and offline validation with{" "}
          <code className={OPERATOR_TYPOGRAPHY.micro}>archlucid auth validate-saml</code>, see the{" "}
          <Link
            href={inAppHelpHref("enterprise-onboarding", "saml-claim-mapping-reference")}
            className={OPERATOR_LINK.inline}
          >
            SAML claim-mapping reference in the enterprise onboarding checklist
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>OIDC catalog alignment</CardTitle>
        </CardHeader>
        <CardContent>
          {note !== null ? (
            <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="identity-providers-note">
              {note}
            </p>
          ) : null}
          {rows !== null && rows.length === 0 && note === null ? (
            <EnterpriseCompactEmptyState {...IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT} />
          ) : null}
          {rows !== null && rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)} data-testid="identity-providers-table">
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-3">Config path</th>
                    <th className="py-2 pr-3">Set</th>
                    <th className="py-2 pr-3">Effective value</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.configPath} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className={cn("py-2 pr-3 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                        {r.configPath}
                      </td>
                      <td className="py-2 pr-3 text-al-text-secondary">{r.isSet ? "yes" : "no"}</td>
                      <td className="break-all py-2 pr-3 text-al-text-secondary">
                        {r.effectiveValue ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <SamlSpConfigurationForm />

      {identityProviderDiagnosticsLoaded ? (
        <IdentityProviderHealthStrip
          payload={identityProviderDiagnostics}
          fetchNote={identityProviderDiagnosticsNote}
        />
      ) : null}

      {authConfigurationDiagnosticsLoaded ? (
        <IdentityProviderSetupChecklist
          configDiagnostics={authConfigurationDiagnostics}
          configDiagnosticsNote={authConfigurationDiagnosticsNote}
          samlOperationalHealth={samlOperationalHealth}
        />
      ) : null}

      {oidcDiagnosticsLoaded ? (
        <OidcDiagnosticsStrip payload={oidcDiagnostics} fetchNote={oidcDiagnosticsNote} />
      ) : null}

      {samlOperationalHealthLoaded ? (
        <SamlOperationalHealthStrip payload={samlOperationalHealth} fetchNote={samlOperationalHealthNote} />
      ) : null}

      <AuthTokenTestMappingCard />
    </div>
  );
}
