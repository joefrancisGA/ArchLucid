"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { components } from "@/lib/openapi-schemas";

type AdminOidcDiagnosticsResponse = components["schemas"]["AdminOidcDiagnosticsResponse"];

export type OidcDiagnosticsStripProps = {
  payload: AdminOidcDiagnosticsResponse | null;
  fetchNote: string | null;
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

function discoveryStatusClass(status: string): string {
  switch (status) {
    case "Healthy":
      return "border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100";
    case "Unreachable":
      return "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100";
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200";
  }
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
          <CardTitle className="text-base">OIDC discovery diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm text-amber-900 dark:text-amber-100" data-testid="oidc-diagnostics-fetch-note">
            {fetchNote}
          </p>
        </CardContent>
      </Card>
    );
  }

  const discoveryStatus = discoveryStatusLabel(payload);

  return (
    <Card data-testid="oidc-diagnostics-card">
      <CardHeader>
        <CardTitle className="text-base">OIDC discovery diagnostics</CardTitle>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          From{" "}
          <span className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200">
            GET /v1/admin/auth/oidc-diagnostics
          </span>{" "}
          (Admin session). Secrets are never returned.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-neutral-800 dark:text-neutral-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Discovery</span>
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${discoveryStatusClass(discoveryStatus)}`}
            data-testid="oidc-diagnostics-discovery-status"
          >
            {discoveryStatus}
          </span>
        </div>
        <dl className="m-0 grid gap-2 text-xs">
          <div>
            <dt className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Auth mode</dt>
            <dd className="m-0 mt-1 font-mono">{payload.authMode ?? "—"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Configured authority</dt>
            <dd className="m-0 mt-1 break-all font-mono">{payload.configuredAuthority ?? "—"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Configured audience</dt>
            <dd className="m-0 mt-1 break-all font-mono">{payload.configuredAudience ?? "—"}</dd>
          </div>
          {payload.openIdConfigurationUrl ? (
            <div>
              <dt className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Discovery URL</dt>
              <dd className="m-0 mt-1 break-all font-mono">{payload.openIdConfigurationUrl}</dd>
            </div>
          ) : null}
          {payload.discoveryError ? (
            <div>
              <dt className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Discovery error</dt>
              <dd className="m-0 mt-1 text-amber-900 dark:text-amber-100" data-testid="oidc-diagnostics-discovery-error">
                {payload.discoveryError}
              </dd>
            </div>
          ) : null}
          {payload.diagnosticSummary ? (
            <div>
              <dt className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Summary</dt>
              <dd className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">{payload.diagnosticSummary}</dd>
            </div>
          ) : null}
        </dl>
        {discoveryStatus === "Unreachable" ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            Verify egress to the IdP, authority URL spelling (including trailing slash), and that access tokens use the
            configured audience. See the generic OIDC runbook linked from configuration docs.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
