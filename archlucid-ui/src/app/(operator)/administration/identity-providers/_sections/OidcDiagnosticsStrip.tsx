"use client";

import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";
import { oidcDiscoveryStatusPresentation } from "@/lib/identity-provider-probe-status-presentation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { components } from "@/lib/openapi-schemas";

type AdminOidcDiagnosticsResponse = components["schemas"]["AdminOidcDiagnosticsResponse"];

export type OidcDiagnosticsStripProps = {
  payload: AdminOidcDiagnosticsResponse | null;
  fetchNote: string | null;
  readonly showTechnicalDetails?: boolean;
};

function discoveryStatusLabel(payload: AdminOidcDiagnosticsResponse): string {
  if (!payload.discoveryAttempted) {
    return "Not attempted";
  }

  if (payload.discoverySucceeded === true) {
    return "Healthy";
  }

  return "Unreachable";
}

export function OidcDiagnosticsStrip(props: OidcDiagnosticsStripProps) {
  const { payload, fetchNote } = props;

  if (!payload && !fetchNote) {
    return null;
  }

  if (!payload) {
    return (
      <Card data-testid="oidc-diagnostics-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>OIDC discovery diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="oidc-diagnostics-fetch-note">
            {fetchNote}
          </p>
        </CardContent>
      </Card>
    );
  }

  const discoveryStatus = discoveryStatusLabel(payload);
  const discoveryPresentation = oidcDiscoveryStatusPresentation(discoveryStatus);

  return (
    <Card data-testid="oidc-diagnostics-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>OIDC discovery diagnostics</CardTitle>
        {props.showTechnicalDetails === true ? (
          <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
            From{" "}
            <span className={cn("font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.micro)}>
              GET /v1/admin/auth/oidc-diagnostics
            </span>{" "}
            (Admin session). Secrets are never returned.
          </p>
        ) : (
          <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
            Discovery validation for the configured OIDC authority and audience.
          </p>
        )}
      </CardHeader>
      <CardContent className={cn("space-y-3 text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Discovery</span>
          <StatusTag
            kind={discoveryPresentation.kind}
            label={discoveryPresentation.label}
            data-testid="oidc-diagnostics-discovery-status"
          />
        </div>
        <dl className={cn("m-0 grid gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <div>
            <dt className={OPERATOR_NAV_GROUP_LABEL}>Authentication mode</dt>
            <dd className="m-0 mt-1">{formatAuthModeLabel(payload.authMode)}</dd>
          </div>
          <div>
            <dt className={OPERATOR_NAV_GROUP_LABEL}>Configured authority</dt>
            <dd className="m-0 mt-1 break-all font-mono">{payload.configuredAuthority ?? "—"}</dd>
          </div>
          <div>
            <dt className={OPERATOR_NAV_GROUP_LABEL}>Configured audience</dt>
            <dd className="m-0 mt-1 break-all font-mono">{payload.configuredAudience ?? "—"}</dd>
          </div>
          {payload.openIdConfigurationUrl && props.showTechnicalDetails === true ? (
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Discovery URL</dt>
              <dd className="m-0 mt-1 break-all font-mono">{payload.openIdConfigurationUrl}</dd>
            </div>
          ) : null}
          {payload.discoveryError ? (
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Discovery error</dt>
              <dd className="m-0 mt-1 text-amber-900 dark:text-amber-100" data-testid="oidc-diagnostics-discovery-error">
                {payload.discoveryError}
              </dd>
            </div>
          ) : null}
          {payload.diagnosticSummary ? (
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Summary</dt>
              <dd className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">{payload.diagnosticSummary}</dd>
            </div>
          ) : null}
        </dl>
        {discoveryStatus === "Unreachable" ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Verify egress to the IdP, authority URL spelling (including trailing slash), and that access tokens use the
            configured audience. See the generic OIDC runbook linked from configuration docs.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatAuthModeLabel(authMode: string | null | undefined): string {
  switch (authMode) {
    case "DevelopmentBypass":
      return "Local development sign-in";
    case "JwtBearer":
      return "OIDC / JWT";
    case "ApiKey":
      return "API key";
    default:
      return authMode ?? "—";
  }
}
