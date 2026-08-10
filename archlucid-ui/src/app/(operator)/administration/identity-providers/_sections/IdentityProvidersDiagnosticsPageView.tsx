"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_DESCRIPTION,
  IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE,
} from "@/lib/identity-providers-settings-copy";
import { canViewIdentityProviderTechnicalDiagnostics } from "@/lib/resolve-identity-providers-overview";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AuthTokenTestMappingCard } from "./AuthTokenTestMappingCard";
import { IdentityProviderHealthStrip } from "./IdentityProviderHealthStrip";
import { IdentityProviderSetupChecklist } from "./IdentityProviderSetupChecklist";
import { IdentityProvidersCatalogTable } from "./IdentityProvidersCatalogTable";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import { OidcDiagnosticsStrip } from "./OidcDiagnosticsStrip";
import { SamlOperationalHealthStrip } from "./SamlOperationalHealthStrip";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersDiagnosticsPageViewProps = {
  readonly model: UseIdentityProvidersSettingsPageModel;
};

export function IdentityProvidersDiagnosticsPageView(
  props: IdentityProvidersDiagnosticsPageViewProps,
): React.JSX.Element {
  const showTechnicalDetails = canViewIdentityProviderTechnicalDiagnostics(isArchLucidInternalOperatorShellEnv());

  return (
    <IdentityProvidersSettingsShell
      pageTitle={IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE}
      pageSubtitle={IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE}
      refreshing={props.model.refreshing}
      lastRefreshedAt={props.model.lastRefreshedAt}
      onRefresh={() => void props.model.refresh()}
    >
      {props.model.identityProviderDiagnosticsLoaded ? (
        <IdentityProviderHealthStrip
          payload={props.model.identityProviderDiagnostics}
          fetchNote={props.model.identityProviderDiagnosticsNote}
          showTechnicalDetails={showTechnicalDetails}
        />
      ) : null}

      {props.model.authConfigurationDiagnosticsLoaded ? (
        <IdentityProviderSetupChecklist
          configDiagnostics={props.model.authConfigurationDiagnostics}
          configDiagnosticsNote={props.model.authConfigurationDiagnosticsNote}
          samlOperationalHealth={props.model.samlOperationalHealth}
          showTechnicalDetails={showTechnicalDetails}
        />
      ) : null}

      {props.model.oidcDiagnosticsLoaded ? (
        <OidcDiagnosticsStrip
          payload={props.model.oidcDiagnostics}
          fetchNote={props.model.oidcDiagnosticsNote}
          showTechnicalDetails={showTechnicalDetails}
        />
      ) : null}

      {props.model.samlOperationalHealthLoaded ? (
        <SamlOperationalHealthStrip
          payload={props.model.samlOperationalHealth}
          fetchNote={props.model.samlOperationalHealthNote}
          showTechnicalDetails={showTechnicalDetails}
        />
      ) : null}

      {showTechnicalDetails ? (
        <details className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800" data-testid="identity-providers-technical-details">
          <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE}
          </summary>
          <div className="mt-4 space-y-4">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_DESCRIPTION}
            </p>
            <IdentityProvidersCatalogTable rows={props.model.rows} note={props.model.note} showConfigPaths />
            <AuthTokenTestMappingCard showTechnicalDetails />
          </div>
        </details>
      ) : (
        <Card data-testid="identity-providers-diagnostics-customer-tools">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Support tooling</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">
              Advanced configuration references and token test mapping are available in internal support environments.
            </p>
            <p className="m-0">
              To validate role mapping safely, open{" "}
              <Link href="/administration/identity-providers/role-mapping" className="font-medium text-teal-800 dark:text-teal-300">
                Role mapping
              </Link>{" "}
              or contact your ArchLucid administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </IdentityProvidersSettingsShell>
  );
}
