"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_DETAILS_TITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_ID,
  IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_DESCRIPTION,
  IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE,
  IDENTITY_PROVIDERS_RECOMMENDED_NEXT_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersOverviewModel } from "@/lib/identity-providers-settings-types";
import { canViewIdentityProviderTechnicalDiagnostics } from "@/lib/resolve-identity-providers-overview";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { components } from "@/lib/openapi-schemas";

import { AuthTokenTestMappingCard } from "./AuthTokenTestMappingCard";
import { IdentityProviderHealthStrip } from "./IdentityProviderHealthStrip";
import { IdentityProviderSetupChecklist } from "./IdentityProviderSetupChecklist";
import { IdentityProvidersCatalogTable } from "./IdentityProvidersCatalogTable";
import { IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import { OidcDiagnosticsStrip } from "./OidcDiagnosticsStrip";
import { SamlOperationalHealthStrip } from "./SamlOperationalHealthStrip";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type AdminIdentityProviderDiagnosticsResponse =
  components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];

type IdentityProvidersDiagnosticsPageViewProps = {
  readonly model: UseIdentityProvidersSettingsPageModel;
};

function diagnosticsBundlePending(model: UseIdentityProvidersSettingsPageModel): boolean {
  return (
    !model.identityProviderDiagnosticsLoaded
    || !model.authConfigurationDiagnosticsLoaded
    || !model.oidcDiagnosticsLoaded
    || !model.samlOperationalHealthLoaded
  );
}

function formatDiagnosticsReadinessLine(overview: IdentityProvidersOverviewModel): string {
  return `${IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL}: ${overview.authenticationModeLabel} · ${IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL}: ${overview.ssoStatus} · ${IDENTITY_PROVIDERS_RECOMMENDED_NEXT_LABEL}: ${overview.recommendedNextStep}`;
}

function bothIdentityProviderProbesNotApplicable(
  payload: AdminIdentityProviderDiagnosticsResponse | null,
): boolean {
  return payload?.oidc?.status === "NotApplicable" && payload?.saml?.status === "NotApplicable";
}

export function IdentityProvidersDiagnosticsPageView(
  props: IdentityProvidersDiagnosticsPageViewProps,
): React.JSX.Element {
  const showTechnicalDetails = canViewIdentityProviderTechnicalDiagnostics(isArchLucidInternalOperatorShellEnv());
  const bundlePending = diagnosticsBundlePending(props.model);
  const showProtocolDetails =
    props.model.oidcDiagnosticsLoaded || props.model.samlOperationalHealthLoaded;
  const collapseHealthIntoProtocol = bothIdentityProviderProbesNotApplicable(props.model.identityProviderDiagnostics);
  const protocolDetailsRef = useRef<HTMLDetailsElement>(null);
  const oidcDeepLinkHandledRef = useRef<boolean>(false);

  // The disclosure this deep link targets only mounts once the protocol payloads settle, so the
  // effect has to wait for that render rather than firing once on mount.
  useEffect(() => {
    if (typeof window === "undefined" || oidcDeepLinkHandledRef.current || !showProtocolDetails) {
      return;
    }

    const hash = window.location.hash.replace(/^#/, "").trim();

    if (hash !== IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_ID) {
      return;
    }

    const details = protocolDetailsRef.current;

    if (details !== null) {
      details.open = true;
    }

    const target = document.getElementById(IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_ID);

    if (target !== null) {
      target.scrollIntoView({ block: "start" });
      oidcDeepLinkHandledRef.current = true;
    }
  }, [showProtocolDetails]);

  return (
    <IdentityProvidersSettingsShell
      pageTitle={IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE}
      pageSubtitle={IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE}
      overview={props.model.overview}
      statusBadgeReady={props.model.dataLoaded}
      refreshing={props.model.refreshing}
      lastRefreshedAt={props.model.lastRefreshedAt}
      diagnosticsDataUnavailable={props.model.diagnosticsDataUnavailable}
      onRefresh={() => void props.model.refresh()}
    >
      <IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip />
      <div className="space-y-4" data-testid="identity-providers-diagnostics-primary-lead">
        {bundlePending ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="identity-providers-diagnostics-loading"
          >
            {IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING}
          </p>
        ) : props.model.diagnosticsDataUnavailable ? null : (
          <p
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="identity-providers-diagnostics-readiness-line"
          >
            {formatDiagnosticsReadinessLine(props.model.overview)}
          </p>
        )}

        {props.model.authConfigurationDiagnosticsLoaded ? (
          <IdentityProviderSetupChecklist
            configDiagnostics={props.model.authConfigurationDiagnostics}
            configDiagnosticsNote={props.model.authConfigurationDiagnosticsNote}
            samlOperationalHealth={props.model.samlOperationalHealth}
            showTechnicalDetails={showTechnicalDetails}
          />
        ) : null}

        {props.model.identityProviderDiagnosticsLoaded && !collapseHealthIntoProtocol ? (
          <IdentityProviderHealthStrip
            payload={props.model.identityProviderDiagnostics}
            fetchNote={props.model.identityProviderDiagnosticsNote}
            showTechnicalDetails={showTechnicalDetails}
          />
        ) : null}

        {showProtocolDetails ? (
          <details
            ref={protocolDetailsRef}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            data-testid="identity-providers-diagnostics-protocol-details"
          >
            <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_DETAILS_TITLE}
            </summary>
            <div className="mt-4 space-y-4">
              {props.model.identityProviderDiagnosticsLoaded && collapseHealthIntoProtocol ? (
                <IdentityProviderHealthStrip
                  payload={props.model.identityProviderDiagnostics}
                  fetchNote={props.model.identityProviderDiagnosticsNote}
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
            </div>
          </details>
        ) : null}
      </div>

      {showTechnicalDetails ? (
        <details
          className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          data-testid="identity-providers-technical-details"
        >
          <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE}
          </summary>
          <div className="mt-4 space-y-4">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_DESCRIPTION}
            </p>
            <IdentityProvidersCatalogTable rows={null} note={null} showConfigPaths />
            <AuthTokenTestMappingCard showTechnicalDetails />
          </div>
        </details>
      ) : (
        <details
          className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          data-testid="identity-providers-diagnostics-customer-tools"
        >
          <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Support tooling
          </summary>
          <div className={cn("mt-4 space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">
              Advanced configuration references and token test mapping are available in internal support environments.
            </p>
            <p className="m-0">
              To validate role mapping safely, open{" "}
              <Link
                href="/administration/identity-providers/role-mapping"
                className={OPERATOR_LINK.inline}
              >
                Role mapping
              </Link>{" "}
              or contact your ArchLucid administrator.
            </p>
          </div>
        </details>
      )}
    </IdentityProvidersSettingsShell>
  );
}
