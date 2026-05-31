"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { operatorSemanticSurface } from "@/lib/design-tokens";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/openapi-schemas";

type AdminAuthConfigurationDiagnosticsResponse =
  components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];
type AdminSamlOperationalHealthResponse = components["schemas"]["AdminSamlOperationalHealthResponse"];

export type IdentityProviderSetupChecklistProps = {
  readonly configDiagnostics: AdminAuthConfigurationDiagnosticsResponse | null;
  readonly configDiagnosticsNote: string | null;
  readonly samlOperationalHealth: AdminSamlOperationalHealthResponse | null;
};

type SetupStep = {
  readonly label: string;
  readonly status: "Ready" | "Action needed" | "Not applicable" | "Unknown";
  readonly detail: string;
  readonly configKey: string | null;
  readonly docHref: string | null;
};

const PRODUCTION_LIKE_AUTH_DOC = "/docs/library/CONFIGURATION_REFERENCE.md";
const OIDC_DOC = "/docs/runbooks/GENERIC_OIDC_SETUP.md";
const SAML_DOC = "/docs/runbooks/SAML_CERT_ROTATION.md";

function statusClass(status: SetupStep["status"]): string {
  switch (status) {
    case "Ready":
      return "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700";
    case "Action needed":
      return "border-rose-700/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50";
    case "Unknown":
      return "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50";
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200";
  }
}

function booleanStep(
  label: string,
  value: boolean | null | undefined,
  ready: string,
  missing: string,
  configKey: string,
  docHref: string,
): SetupStep {
  if (value === true) {
    return { label, status: "Ready", detail: ready, configKey, docHref };
  }

  if (value === false) {
    return { label, status: "Action needed", detail: missing, configKey, docHref };
  }

  return {
    label,
    status: "Not applicable",
    detail: "This signal is not applicable for the current auth mode.",
    configKey: null,
    docHref: null,
  };
}

function discoveryStep(config: AdminAuthConfigurationDiagnosticsResponse): SetupStep {
  if (config.authMode === "ApiKey") {
    return {
      label: "Discovery",
      status: "Not applicable",
      detail: "API key mode does not use OIDC discovery; configure JwtBearer before enterprise SSO.",
      configKey: "ArchLucidAuth:Mode",
      docHref: PRODUCTION_LIKE_AUTH_DOC,
    };
  }

  if (config.openIdDiscoverySucceeded === true) {
    return {
      label: "Discovery",
      status: "Ready",
      detail: "OIDC discovery metadata is reachable.",
      configKey: "ArchLucidAuth:Authority",
      docHref: OIDC_DOC,
    };
  }

  if (config.openIdDiscoverySucceeded === false) {
    return {
      label: "Discovery",
      status: "Action needed",
      detail: "OIDC metadata is unreachable or invalid. Verify ArchLucidAuth:Authority and outbound network access.",
      configKey: "ArchLucidAuth:Authority",
      docHref: OIDC_DOC,
    };
  }

  return {
    label: "Discovery",
    status: "Unknown",
    detail: "Discovery was not attempted for this configuration.",
    configKey: "ArchLucidAuth:Authority",
    docHref: OIDC_DOC,
  };
}

function certificateStep(
  config: AdminAuthConfigurationDiagnosticsResponse,
  saml: AdminSamlOperationalHealthResponse | null,
): SetupStep {
  if (config.saml2Enabled !== true) {
    return {
      label: "Certificate health",
      status: "Not applicable",
      detail: "SAML is disabled, so SP signing certificate health is not required.",
      configKey: "Authentication:Saml2:Enabled",
      docHref: SAML_DOC,
    };
  }

  if (saml?.spSigningCertificateDiagnosticSummary) {
    return {
      label: "Certificate health",
      status: "Action needed",
      detail: saml.spSigningCertificateDiagnosticSummary,
      configKey: "Authentication:Saml2:SigningCertificate",
      docHref: SAML_DOC,
    };
  }

  if (saml?.spSigningCertificateNotAfterUtc) {
    return {
      label: "Certificate health",
      status: "Ready",
      detail: "SAML SP signing certificate expiry is known.",
      configKey: "Authentication:Saml2:SigningCertificate",
      docHref: SAML_DOC,
    };
  }

  return {
    label: "Certificate health",
    status: "Unknown",
    detail: "SAML is enabled but certificate expiry was not returned. Upload signing certificate metadata.",
    configKey: "Authentication:Saml2:SigningCertificate",
    docHref: SAML_DOC,
  };
}

function buildSteps(
  config: AdminAuthConfigurationDiagnosticsResponse,
  saml: AdminSamlOperationalHealthResponse | null,
): SetupStep[] {
  return [
    booleanStep(
      "Auth mode",
      config.authMode === "DevelopmentBypass" ? false : true,
      `Auth mode is ${config.authMode}.`,
      "DevelopmentBypass is local-only; set ArchLucidAuth:Mode to JwtBearer or ApiKey for shared environments.",
      "ArchLucidAuth:Mode",
      PRODUCTION_LIKE_AUTH_DOC,
    ),
    discoveryStep(config),
    booleanStep(
      "Scope / audience claim",
      config.audienceConfigured,
      "Audience validation is configured.",
      "Configure ArchLucidAuth:Audience or the local JWT audience.",
      "ArchLucidAuth:Audience",
      OIDC_DOC,
    ),
    booleanStep(
      "Role claim mapping",
      config.roleClaimNameConfigured,
      "Role claim mapping is configured.",
      "Configure SAML role claim sources or tenant SSO RoleClaimName mapping.",
      "ArchLucidAuth:RoleClaimName",
      SAML_DOC,
    ),
    certificateStep(config, saml),
  ];
}

export function IdentityProviderSetupChecklist(props: IdentityProviderSetupChecklistProps) {
  const { configDiagnostics, configDiagnosticsNote, samlOperationalHealth } = props;

  if (!configDiagnostics && !configDiagnosticsNote) {
    return null;
  }

  const steps = configDiagnostics ? buildSteps(configDiagnostics, samlOperationalHealth) : [];
  const nextStep = steps.find((step) => step.status === "Action needed" || step.status === "Unknown");

  return (
    <Card data-testid="identity-provider-setup-checklist">
      <CardHeader>
        <CardTitle className="text-base">Identity setup checklist</CardTitle>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          One-screen setup status from{" "}
          <span className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200">
            GET /v1/admin/auth/configuration-diagnostics
          </span>
          . Values are booleans and labels only; no secrets are returned.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {configDiagnosticsNote ? (
          <p className="m-0 text-sm text-amber-900 dark:text-amber-100" data-testid="identity-provider-setup-note">
            {configDiagnosticsNote}
          </p>
        ) : null}
        {nextStep ? (
          <p className="m-0 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <strong>Next setup step:</strong> {nextStep.detail}
            {nextStep.configKey ? (
              <>
                {" "}
                Config key: <code>{nextStep.configKey}</code>
              </>
            ) : null}
          </p>
        ) : configDiagnostics ? (
          <p className={cn("m-0", operatorSemanticSurface("info"))}>
            Core identity setup checks are ready for this auth mode.
          </p>
        ) : null}
        {steps.length > 0 ? (
          <div className="grid gap-2">
            {steps.map((step) => (
              <div
                key={step.label}
                className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
                data-testid={`identity-provider-setup-${step.label.toLowerCase().replaceAll(" ", "-").replace("/", "")}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{step.label}</span>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(step.status)}`}>
                    {step.status}
                  </span>
                </div>
                <p className="m-0 mt-2 text-xs text-neutral-700 dark:text-neutral-300">{step.detail}</p>
                {step.configKey ? (
                  <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    Config key: <code>{step.configKey}</code>
                  </p>
                ) : null}
                {step.docHref ? (
                  <p className="m-0 mt-2 text-xs">
                    <Link href={toDocsBlobUrl(step.docHref)} className="underline" rel="noopener noreferrer" target="_blank">
                      Setup guide
                    </Link>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
