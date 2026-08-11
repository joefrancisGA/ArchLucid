"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { oidcPageDiscoveryStatusPresentation } from "@/lib/identity-provider-probe-status-presentation";
import { resolveOidcPagePrimaryCta, resolveOidcPageSecondaryCta } from "@/lib/oidc-page-cta";
import {
  IDENTITY_PROVIDERS_OIDC_EMPTY,
  IDENTITY_PROVIDERS_OIDC_LOADING,
  IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_OIDC_PAGE_TITLE,
} from "@/lib/identity-providers-settings-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersOidcPageViewProps = {
  readonly model: UseIdentityProvidersSettingsPageModel;
};

function OidcPageCtaRow(props: {
  readonly primaryTestId: string;
  readonly secondaryTestId: string;
  readonly oidc: UseIdentityProvidersSettingsPageModel["oidcDiagnostics"];
  readonly overviewOidcStatus: string;
}): React.JSX.Element {
  const primaryCta = resolveOidcPagePrimaryCta(props.oidc, props.overviewOidcStatus);
  const secondaryCta = resolveOidcPageSecondaryCta(props.oidc, props.overviewOidcStatus);

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm">
        <Link href={primaryCta.href} data-testid={props.primaryTestId}>
          {primaryCta.label}
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={secondaryCta.href} data-testid={props.secondaryTestId}>
          {secondaryCta.label}
        </Link>
      </Button>
    </div>
  );
}

export function IdentityProvidersOidcPageView(props: IdentityProvidersOidcPageViewProps): React.JSX.Element {
  const oidc = props.model.oidcDiagnostics;
  const oidcLoaded = props.model.oidcDiagnosticsLoaded;
  const discoveryPresentation = oidcPageDiscoveryStatusPresentation(oidc, props.model.overview.oidcStatus);

  return (
    <IdentityProvidersSettingsShell
      pageTitle={IDENTITY_PROVIDERS_OIDC_PAGE_TITLE}
      pageSubtitle={IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE}
      refreshing={props.model.refreshing}
      lastRefreshedAt={props.model.lastRefreshedAt}
      onRefresh={() => void props.model.refresh()}
    >
      <Card data-testid="identity-providers-oidc-status-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>OIDC/JWT status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!oidcLoaded ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="identity-providers-oidc-loading"
            >
              {IDENTITY_PROVIDERS_OIDC_LOADING}
            </p>
          ) : !oidc ? (
            <>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="identity-providers-oidc-empty"
              >
                {IDENTITY_PROVIDERS_OIDC_EMPTY}
              </p>
              {props.model.oidcDiagnosticsNote ? (
                <p
                  className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="identity-providers-oidc-fetch-note"
                >
                  {props.model.oidcDiagnosticsNote}
                </p>
              ) : null}
              <OidcPageCtaRow
                primaryTestId="identity-providers-oidc-primary-cta"
                secondaryTestId="identity-providers-oidc-secondary-cta"
                oidc={oidc}
                overviewOidcStatus={props.model.overview.oidcStatus}
              />
            </>
          ) : (
            <>
              <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
                <div>
                  <dt className="text-al-text-secondary">Discovery status</dt>
                  <dd className="m-0 mt-1" data-testid="identity-providers-oidc-discovery-status">
                    <StatusTag kind={discoveryPresentation.kind} label={discoveryPresentation.label} />
                  </dd>
                </div>
                <div>
                  <dt className="text-al-text-secondary">Provider authority</dt>
                  <dd className="m-0 mt-1 break-all text-al-text-primary">{oidc.configuredAuthority ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-al-text-secondary">Audience / client identifier</dt>
                  <dd className="m-0 mt-1 break-all text-al-text-primary">{oidc.configuredAudience ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-al-text-secondary">Role claim mapping</dt>
                  <dd className="m-0 mt-1 text-al-text-primary">{props.model.overview.roleMappingStatus}</dd>
                </div>
              </dl>
              {oidc.discoveryError ? (
                <p
                  className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="identity-providers-oidc-discovery-error"
                >
                  {oidc.discoveryError}
                </p>
              ) : null}
              <OidcPageCtaRow
                primaryTestId="identity-providers-oidc-primary-cta"
                secondaryTestId="identity-providers-oidc-secondary-cta"
                oidc={oidc}
                overviewOidcStatus={props.model.overview.oidcStatus}
              />
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Host-level OIDC/JWT settings are configured in your deployment environment. Use the{" "}
                <Link href="/administration/identity/sso-wizard" className={OPERATOR_LINK.inline}>
                  SSO configuration wizard
                </Link>{" "}
                for guided tenant setup.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </IdentityProvidersSettingsShell>
  );
}
