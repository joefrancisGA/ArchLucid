"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_OIDC_PAGE_TITLE,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
  IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
} from "@/lib/identity-providers-settings-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersOidcPageViewProps = {
  readonly model: UseIdentityProvidersSettingsPageModel;
};

export function IdentityProvidersOidcPageView(props: IdentityProvidersOidcPageViewProps): React.JSX.Element {
  const oidc = props.model.oidcDiagnostics;
  const discoveryStatus =
    oidc?.discoverySucceeded === true
      ? IDENTITY_PROVIDERS_STATUS_HEALTHY
      : oidc?.discoverySucceeded === false
        ? IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW
        : props.model.overview.oidcStatus === IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE
          ? IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE
          : IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED;

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
          <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className="text-al-text-secondary">Discovery status</dt>
              <dd className="m-0 mt-1 font-medium text-al-text-primary" data-testid="identity-providers-oidc-discovery-status">
                {discoveryStatus}
              </dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Provider authority</dt>
              <dd className="m-0 mt-1 break-all text-al-text-primary">{oidc?.configuredAuthority ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Audience / client identifier</dt>
              <dd className="m-0 mt-1 break-all text-al-text-primary">{oidc?.configuredAudience ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Role claim mapping</dt>
              <dd className="m-0 mt-1 text-al-text-primary">{props.model.overview.roleMappingStatus}</dd>
            </div>
          </dl>
          {oidc?.discoveryError ? (
            <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)} data-testid="identity-providers-oidc-discovery-error">
              {oidc.discoveryError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/administration/identity/sso-wizard">Open SSO wizard</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/administration/identity-providers/diagnostics">Validate discovery</Link>
            </Button>
          </div>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Host-level OIDC/JWT settings are configured in your deployment environment. Use the{" "}
            <Link href="/administration/identity/sso-wizard" className={OPERATOR_LINK.inline}>
              SSO configuration wizard
            </Link>{" "}
            for guided tenant setup.
          </p>
        </CardContent>
      </Card>
    </IdentityProvidersSettingsShell>
  );
}
