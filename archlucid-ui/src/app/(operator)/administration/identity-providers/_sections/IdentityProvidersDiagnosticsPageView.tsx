"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  IDENTITY_PROVIDERS_NAV_ROLE_MAPPING,
  IDENTITY_PROVIDERS_RECOMMENDED_NEXT_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL,
  identityProvidersDiagnosticsPageSubtitle,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersOverviewModel } from "@/lib/identity-providers-settings-types";
import { canViewIdentityProviderTechnicalDiagnostics } from "@/lib/resolve-identity-providers-overview";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { components } from "@/lib/openapi-schemas";

import { AuthTokenTestMappingCard } from "./AuthTokenTestMappingCard";
import { IdentityProviderHealthStrip } from "./IdentityProviderHealthStrip";
import { IdentityProviderSetupChecklist } from "./IdentityProviderSetupChecklist";
import { IdentityProvidersCatalogTable } from "./IdentityProvidersCatalogTable";
import { IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { IdentityProvidersDiagnosticsBreadcrumb } from "./IdentityProvidersDiagnosticsBreadcrumb";
import { IdentityProvidersDiagnosticsBuyerChrome } from "./IdentityProvidersDiagnosticsBuyerChrome";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import {
  DIAGNOSTICS_SETTINGS_PRIMARY_CONTENT_ID,
  DIAGNOSTICS_SETTINGS_SKIP_LINK_LABEL,
  IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_INTRO,
  IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_ROLE_MAPPING_PREFIX,
  IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_ROLE_MAPPING_SUFFIX,
  IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_TITLE,
} from "./diagnostics-settings-page-copy";
import { OidcDiagnosticsStrip } from "./OidcDiagnosticsStrip";
import { SamlOperationalHealthStrip } from "./SamlOperationalHealthStrip";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  identityProvidersDiagnosticsProtocolDisclosureHrefFromSearch,
  parseIdentityProvidersDiagnosticsProtocolOpenFromSearch,
} from "@/lib/administration/identity-providers-diagnostics-protocol-disclosure-url";

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
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/identity-providers/diagnostics";
  const searchParams = useSearchParams();
  const identityProvidersDiagnosticsProtocolOpenParam = searchParams.get("identityProvidersDiagnosticsProtocolOpen");
  const showTechnicalDetails = canViewIdentityProviderTechnicalDiagnostics(isArchLucidInternalOperatorShellEnv());
  const bundlePending = diagnosticsBundlePending(props.model);
  const showProtocolDetails =
    props.model.oidcDiagnosticsLoaded || props.model.samlOperationalHealthLoaded;
  const collapseHealthIntoProtocol = bothIdentityProviderProbesNotApplicable(props.model.identityProviderDiagnostics);
  const [protocolDetailsOpen, setProtocolDetailsOpenState] = useState(() =>
    parseIdentityProvidersDiagnosticsProtocolOpenFromSearch(identityProvidersDiagnosticsProtocolOpenParam),
  );
  const oidcDeepLinkHandledRef = useRef<boolean>(false);

  const syncProtocolDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        identityProvidersDiagnosticsProtocolDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setProtocolDetailsOpen = useCallback(
    (open: boolean) => {
      setProtocolDetailsOpenState(open);
      syncProtocolDetailsOpenToUrl(open);
    },
    [syncProtocolDetailsOpenToUrl],
  );

  useEffect(() => {
    setProtocolDetailsOpenState(
      parseIdentityProvidersDiagnosticsProtocolOpenFromSearch(identityProvidersDiagnosticsProtocolOpenParam),
    );
  }, [identityProvidersDiagnosticsProtocolOpenParam]);

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

    setProtocolDetailsOpenState(true);

    const target = document.getElementById(IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_ID);

    if (target !== null) {
      target.scrollIntoView({ block: "start" });
      oidcDeepLinkHandledRef.current = true;
    }
  }, [showProtocolDetails]);

  return (
    <IdentityProvidersSettingsShell
      pageTitle={IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE}
      pageSubtitle={identityProvidersDiagnosticsPageSubtitle(buyerPolishedShell)}
      overview={props.model.overview}
      statusBadgeReady={props.model.dataLoaded}
      refreshing={props.model.refreshing}
      lastRefreshedAt={props.model.lastRefreshedAt}
      diagnosticsDataUnavailable={props.model.diagnosticsDataUnavailable}
      headerBreadcrumb={buyerPolishedShell ? <IdentityProvidersDiagnosticsBreadcrumb /> : undefined}
      primaryContentId={buyerPolishedShell ? DIAGNOSTICS_SETTINGS_PRIMARY_CONTENT_ID : undefined}
      skipLinkLabel={buyerPolishedShell ? DIAGNOSTICS_SETTINGS_SKIP_LINK_LABEL : undefined}
      onRefresh={() => void props.model.refresh()}
    >
      {buyerPolishedShell ? (
        <IdentityProvidersDiagnosticsBuyerChrome />
      ) : (
        <IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip />
      )}
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
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            data-testid="identity-providers-diagnostics-protocol-details"
            open={protocolDetailsOpen}
            onToggle={(event) => {
              setProtocolDetailsOpen((event.currentTarget as HTMLDetailsElement).open);
            }}
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
            {IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_TITLE}
          </summary>
          <div className={cn("mt-4 space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">
              {IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_INTRO}
            </p>
            <p className="m-0">
              {IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_ROLE_MAPPING_PREFIX}{" "}
              <Link
                href="/administration/identity-providers/role-mapping"
                className={OPERATOR_LINK.inline}
              >
                {IDENTITY_PROVIDERS_NAV_ROLE_MAPPING}
              </Link>{" "}
              {IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_ROLE_MAPPING_SUFFIX}
            </p>
          </div>
        </details>
      )}
    </IdentityProvidersSettingsShell>
  );
}
