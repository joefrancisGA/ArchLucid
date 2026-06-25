"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { components } from "@/lib/openapi-schemas";
import { cn } from "@/lib/utils";

type AdminIdentityProviderDiagnosticsResponse =
  components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];
type AdminIdentityProviderHealthProbe = components["schemas"]["AdminIdentityProviderHealthProbe"];

export type IdentityProviderHealthStripProps = {
  payload: AdminIdentityProviderDiagnosticsResponse | null;
  fetchNote: string | null;
};

function statusBadgeClass(status: string | undefined): string {
  switch (status) {
    case "Healthy":
      return "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700";
    case "Degraded":
      return "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50";
    case "Unreachable":
      return "border-rose-700/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50";
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200";
  }
}

function HealthProbeRow(props: { label: string; probe: AdminIdentityProviderHealthProbe | undefined }) {
  const { label, probe } = props;
  const status = probe?.status ?? "NotApplicable";
  const summary = probe?.summary?.trim() ?? "No diagnostic summary available.";

  return (
    <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700" data-testid={`identity-provider-health-${label.toLowerCase()}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{label}</span>
        <span
          className={cn("inline-flex rounded-full border px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge, statusBadgeClass(status))}
          data-testid={`identity-provider-health-status-${label.toLowerCase()}`}
        >
          {status}
        </span>
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
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          Cached probes from{" "}
          <span className={cn("font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.micro)}>
            GET /v1/admin/diagnostics/identity-providers
          </span>{" "}
          (Admin session). Read-only — does not alter authentication behaviour.
        </p>
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
