"use client";

import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";
import { identityProviderProbeStatusPresentation } from "@/lib/identity-provider-probe-status-presentation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { components } from "@/lib/openapi-schemas";

type AdminIdentityProviderDiagnosticsResponse =
  components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];
type AdminIdentityProviderHealthProbe = components["schemas"]["AdminIdentityProviderHealthProbe"];

export type IdentityProviderHealthStripProps = {
  payload: AdminIdentityProviderDiagnosticsResponse | null;
  fetchNote: string | null;
  readonly showTechnicalDetails?: boolean;
};

function HealthProbeRow(props: { label: string; probe: AdminIdentityProviderHealthProbe | undefined }) {
  const { label, probe } = props;
  const presentation = identityProviderProbeStatusPresentation(probe?.status);
  const summary = probe?.summary?.trim() ?? "No diagnostic summary available.";

  return (
    <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700" data-testid={`identity-provider-health-${label.toLowerCase()}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{label}</span>
        <StatusTag
          kind={presentation.kind}
          label={presentation.label}
          data-testid={`identity-provider-health-status-${label.toLowerCase()}`}
        />
      </div>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{summary}</p>
    </div>
  );
}

export function IdentityProviderHealthStrip(props: IdentityProviderHealthStripProps) {
  const { payload, fetchNote } = props;

  if (!payload && !fetchNote) {
    return null;
  }

  return (
    <Card data-testid="identity-provider-health-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Identity provider health</CardTitle>
        {props.showTechnicalDetails === true ? (
          <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
            Cached probes from{" "}
            <span className={cn("font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.micro)}>
              GET /v1/admin/diagnostics/identity-providers
            </span>{" "}
            (Admin session). Read-only — does not alter authentication behavior.
          </p>
        ) : (
          <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
            Read-only health status for configured identity providers.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {fetchNote ? (
          <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="identity-provider-health-fetch-note">
            {fetchNote}
          </p>
        ) : null}
        {payload ? (
          <>
            <HealthProbeRow label="OIDC" probe={payload.oidc} />
            <HealthProbeRow label="SAML" probe={payload.saml} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
