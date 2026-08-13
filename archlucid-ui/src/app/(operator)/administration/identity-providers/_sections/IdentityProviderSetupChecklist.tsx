"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import {
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
  IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
} from "@/lib/identity-providers-settings-copy";
import type { components } from "@/lib/openapi-schemas";

type AdminAuthConfigurationDiagnosticsResponse =
  components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];
type AdminSamlOperationalHealthResponse = components["schemas"]["AdminSamlOperationalHealthResponse"];

export type IdentityProviderSetupChecklistProps = {
  readonly configDiagnostics: AdminAuthConfigurationDiagnosticsResponse | null;
  readonly configDiagnosticsNote: string | null;
  readonly samlOperationalHealth: AdminSamlOperationalHealthResponse | null;
  readonly showTechnicalDetails?: boolean;
};

type SetupStep = {
  readonly label: string;
  readonly status: "Ready" | "Action needed" | "Not applicable" | "Unknown";
  readonly detail: string;
  readonly configKey: string | null;
  readonly docHref: string | null;
};

const PRODUCTION_LIKE_AUTH_DOC = "/docs/library/customer-facing/AUTHENTICATION_AND_SIGN_IN.md";
const OIDC_DOC = "/docs/runbooks/GENERIC_OIDC_SETUP.md";
const SAML_DOC = "/docs/runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md";
const PRIVATE_BETA_AUTH_DOC = "/docs/library/customer-facing/AUTHENTICATION_AND_SIGN_IN.md";

const SETUP_STEP_STATUS_SORT_ORDER: Readonly<Record<SetupStep["status"], number>> = {
  "Action needed": 0,
  "Unknown": 1,
  "Ready": 2,
  "Not applicable": 3,
};

function setupStepStatusPresentation(
  status: SetupStep["status"],
): { readonly kind: EnterpriseStatusKind; readonly label: string } {
  switch (status) {
    case "Ready":
      return { kind: "ready", label: status };
    case "Action needed":
      return { kind: "needs-attention", label: status };
    case "Unknown":
      return { kind: "needs-attention", label: IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW };
    case "Not applicable":
      return { kind: "neutral", label: IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE };
    default: {
      const _exhaustive: never = status;

      return _exhaustive;
    }
  }
}

function setupGuideLinkLabel(docHref: string): string {
  if (docHref === OIDC_DOC) {
    return "OIDC discovery setup";
  }

  if (docHref === SAML_DOC) {
    return "Certificate rotation runbook";
  }

  return "Setup guide";
}

function booleanStep(
  label: string,
  value: boolean | null | undefined,
  ready: string,
  missing: string,
  configKey: string | null,
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

function discoveryStep(config: AdminAuthConfigurationDiagnosticsResponse, showTechnicalDetails: boolean): SetupStep {
  if (config.authMode === "ApiKey") {
    return {
      label: "Discovery",
      status: "Not applicable",
      detail: "API key mode does not use OIDC discovery.",
      configKey: showTechnicalDetails ? "ArchLucidAuth:Mode" : null,
      docHref: PRODUCTION_LIKE_AUTH_DOC,
    };
  }

  if (config.openIdDiscoverySucceeded === true) {
    return {
      label: "Discovery",
      status: "Ready",
      detail: "OIDC discovery metadata is reachable.",
      configKey: showTechnicalDetails ? "ArchLucidAuth:Authority" : null,
      docHref: OIDC_DOC,
    };
  }

  if (config.openIdDiscoverySucceeded === false) {
    return {
      label: "Discovery",
      status: "Action needed",
      detail: "OIDC metadata is unreachable or invalid. Verify the provider authority and outbound network access.",
      configKey: showTechnicalDetails ? "ArchLucidAuth:Authority" : null,
      docHref: OIDC_DOC,
    };
  }

  return {
    label: "Discovery",
    status: "Unknown",
    detail: "Discovery was not attempted for this configuration.",
    configKey: showTechnicalDetails ? "ArchLucidAuth:Authority" : null,
    docHref: OIDC_DOC,
  };
}

function certificateStep(
  config: AdminAuthConfigurationDiagnosticsResponse,
  saml: AdminSamlOperationalHealthResponse | null,
  showTechnicalDetails: boolean,
): SetupStep {
  if (config.saml2Enabled !== true) {
    return {
      label: "Certificate health",
      status: "Not applicable",
      detail: "SAML is disabled, so SP signing certificate health is not required.",
      configKey: showTechnicalDetails ? "Authentication:Saml2:Enabled" : null,
      docHref: SAML_DOC,
    };
  }

  if (saml?.spSigningCertificateDiagnosticSummary) {
    return {
      label: "Certificate health",
      status: "Action needed",
      detail: saml.spSigningCertificateDiagnosticSummary,
      configKey: showTechnicalDetails ? "Authentication:Saml2:SigningCertificate" : null,
      docHref: SAML_DOC,
    };
  }

  if (saml?.spSigningCertificateNotAfterUtc) {
    return {
      label: "Certificate health",
      status: "Ready",
      detail: "SAML SP signing certificate expiry is known.",
      configKey: showTechnicalDetails ? "Authentication:Saml2:SigningCertificate" : null,
      docHref: SAML_DOC,
    };
  }

  return {
    label: "Certificate health",
    status: "Unknown",
    detail: "SAML is enabled but certificate expiry was not returned. Upload signing certificate metadata.",
    configKey: showTechnicalDetails ? "Authentication:Saml2:SigningCertificate" : null,
    docHref: SAML_DOC,
  };
}

function buildSteps(
  config: AdminAuthConfigurationDiagnosticsResponse,
  saml: AdminSamlOperationalHealthResponse | null,
  showTechnicalDetails: boolean,
): SetupStep[] {
  return [
    authModeStep(config, showTechnicalDetails),
    booleanStep(
      "Invite email base URL",
      config.operatorBaseUrlConfigured,
      "Operator base URL is configured for invitation accept links.",
      showTechnicalDetails
        ? "Set Email:OperatorBaseUrl to your operator UI origin so invitations include a clickable accept link."
        : "Set the operator UI origin so invitations include a clickable accept link.",
      showTechnicalDetails ? "Email:OperatorBaseUrl" : null,
      PRIVATE_BETA_AUTH_DOC,
    ),
    booleanStep(
      "Invite session signing",
      config.localTrialIdentityConfigured,
      "Local trial identity JWT signing is configured for invite accept → session.",
      showTechnicalDetails
        ? "Configure Auth:Trial:LocalIdentity (JwtIssuer, JwtAudience, JwtPrivateKeyPemPath) so invite accept can mint API sessions."
        : "Configure invite-accept session signing so accepted invitations can mint API sessions.",
      showTechnicalDetails ? "Auth:Trial:LocalIdentity" : null,
      PRIVATE_BETA_AUTH_DOC,
    ),
    discoveryStep(config, showTechnicalDetails),
    booleanStep(
      "Scope / audience claim",
      config.audienceConfigured,
      "Audience validation is configured.",
      "Configure the OIDC audience or client identifier.",
      showTechnicalDetails ? "ArchLucidAuth:Audience" : null,
      OIDC_DOC,
    ),
    booleanStep(
      "Role claim mapping",
      config.roleClaimNameConfigured,
      "Role claim mapping is configured.",
      "Configure SAML role claim sources or tenant SSO role mapping.",
      showTechnicalDetails ? "ArchLucidAuth:RoleClaimName" : null,
      SAML_DOC,
    ),
    certificateStep(config, saml, showTechnicalDetails),
  ];
}

function authModeStep(config: AdminAuthConfigurationDiagnosticsResponse, showTechnicalDetails: boolean): SetupStep {
  if (config.authMode === "DevelopmentBypass") {
    return {
      label: "Authentication mode",
      status: "Action needed",
      detail: "Local development sign-in is enabled. Configure production sign-in before shared workspace use.",
      configKey: showTechnicalDetails ? "ArchLucidAuth:Mode" : null,
      docHref: PRODUCTION_LIKE_AUTH_DOC,
    };
  }

  return {
    label: "Authentication mode",
    status: "Ready",
    detail: `Authentication mode is configured for ${formatAuthModeLabel(config.authMode)}.`,
    configKey: showTechnicalDetails ? "ArchLucidAuth:Mode" : null,
    docHref: PRODUCTION_LIKE_AUTH_DOC,
  };
}

function formatAuthModeLabel(authMode: string | null | undefined): string {
  switch (authMode) {
    case "DevelopmentBypass":
      return "local development sign-in";
    case "JwtBearer":
      return "OIDC / JWT";
    case "ApiKey":
      return "API key";
    default:
      return authMode ?? "the current mode";
  }
}

export function IdentityProviderSetupChecklist(props: IdentityProviderSetupChecklistProps) {
  const { configDiagnostics, configDiagnosticsNote, samlOperationalHealth } = props;

  if (!configDiagnostics && !configDiagnosticsNote) {
    return null;
  }

  const steps = configDiagnostics ? buildSteps(configDiagnostics, samlOperationalHealth, props.showTechnicalDetails === true) : [];
  const sortedSteps = [...steps].sort(
    (left, right) => SETUP_STEP_STATUS_SORT_ORDER[left.status] - SETUP_STEP_STATUS_SORT_ORDER[right.status],
  );
  const outstandingSteps = sortedSteps.filter(
    (step) => step.status === "Action needed" || step.status === "Unknown",
  );
  const nextStep = outstandingSteps[0];

  return (
    <Card data-testid="identity-provider-setup-checklist">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Identity setup checklist</CardTitle>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          {props.showTechnicalDetails === true
            ? "Setup status from identity configuration diagnostics. Values are booleans and labels only; no secrets are returned."
            : "One-screen setup status for authentication, discovery, role mapping, and certificate health."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {configDiagnosticsNote ? (
          <p
            className={cn("m-0", operatorSemanticSurface("warn"), OPERATOR_TYPOGRAPHY.body)}
            data-testid="identity-provider-setup-note"
          >
            {configDiagnosticsNote}
          </p>
        ) : null}
        {nextStep ? (
          <p
            className={cn(
              "m-0 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="identity-provider-setup-next-step-banner"
          >
            <strong>
              {outstandingSteps.length === 1
                ? "Next setup step:"
                : `${String(outstandingSteps.length)} setup steps need attention — start with:`}
            </strong>{" "}
            {nextStep.detail}
            {nextStep.configKey && props.showTechnicalDetails === true ? (
              <>
                {" "}
                Config key: <code>{nextStep.configKey}</code>
              </>
            ) : null}
            {nextStep.docHref ? (
              <>
                {" "}
                <Link href={resolveInAppDocHref(nextStep.docHref)} className={OPERATOR_LINK.nav}>
                  {setupGuideLinkLabel(nextStep.docHref)}
                </Link>
              </>
            ) : null}
          </p>
        ) : configDiagnostics ? (
          <p className={cn("m-0", operatorSemanticSurface("info"))}>
            Core identity setup checks are ready for this auth mode.
          </p>
        ) : null}
        {sortedSteps.length > 0 ? (
          <div className="grid gap-2">
            {sortedSteps.map((step) => {
              const statusPresentation = setupStepStatusPresentation(step.status);

              return (
              <div
                key={step.label}
                className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
                data-testid={`identity-provider-setup-${step.label.toLowerCase().replaceAll(" ", "-").replace("/", "")}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{step.label}</span>
                  <StatusTag kind={statusPresentation.kind} label={statusPresentation.label} />
                </div>
                <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{step.detail}</p>
                {step.configKey && props.showTechnicalDetails === true ? (
                  <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
                    Config key: <code>{step.configKey}</code>
                  </p>
                ) : null}
                {step.docHref ? (
                  <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
                    <Link href={resolveInAppDocHref(step.docHref)} className={OPERATOR_LINK.nav}>
                      {setupGuideLinkLabel(step.docHref)}
                    </Link>
                  </p>
                ) : null}
              </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
