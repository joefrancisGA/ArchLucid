import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";
import type { AdminConfigLintSummary } from "@/lib/fetch-admin-config-lint";
import type { FirstPilotReadinessStatus } from "@/lib/first-pilot-readiness-cockpit";
import {
  type FinishSetupWizardContext,
  type FinishSetupWizardDeploymentOptions,
  resolveFinishSetupWizardDeploymentOptions,
  resolveFinishSetupWizardSteps,
} from "@/lib/finish-setup-wizard-steps";
import { IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW } from "@/lib/identity-providers-settings-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { mapConfigLintReadiness } from "@/lib/map-config-lint-readiness";
import { resolveCorporateSignInConfigured } from "@/lib/resolve-corporate-sign-in-configured";
import {
  resolveIdentityProvidersOverview,
  type ResolveIdentityProvidersOverviewInput,
} from "@/lib/resolve-identity-providers-overview";

export type AdminPrerequisiteRow = {
  readonly id: string;
  readonly label: string;
  readonly status: FirstPilotReadinessStatus;
  readonly summary: string;
  readonly href: string;
  readonly cta: string;
  readonly sortOrder: number;
};

export type AdminPrerequisitesCloudSummary = {
  readonly anyConfigured: boolean;
  readonly loadFailed: boolean;
};

export type AdminPrerequisitesBillingSummary = {
  readonly paymentPastDue: boolean;
  readonly loadFailed: boolean;
};

export type ResolveAdminPrerequisitesReadinessInput = {
  readonly finishSetupContext: FinishSetupWizardContext;
  readonly configLint: AdminConfigLintSummary | null;
  readonly identity: ResolveIdentityProvidersOverviewInput | null;
  readonly identityLoadFailed: boolean;
  readonly cloud: AdminPrerequisitesCloudSummary;
  readonly billing: AdminPrerequisitesBillingSummary;
  readonly deployment?: FinishSetupWizardDeploymentOptions;
  /** Host config-lint row — internal operator shell only. */
  readonly includeHostConfigurationLint?: boolean;
};

export const ADMIN_PREREQUISITE_SORT_ORDER = {
  platformHealth: 10,
  productionConfig: 20,
  cloudConnection: 30,
  corporateSignIn: 40,
  adminRole: 50,
  billing: 60,
} as const;

const OPTIONAL_READINESS_ROW_IDS = new Set<string>(["cloud-connection"]);

function buildCorporateSignInRow(input: ResolveAdminPrerequisitesReadinessInput): AdminPrerequisiteRow {
  const identityReady = resolveCorporateSignInConfigured(input.identity, input.identityLoadFailed) === true;
  let summary = "Wire corporate sign-in before inviting operators to production.";
  let href = "/administration/identity/sso-wizard";
  let cta = "Open SSO wizard";
  let status: FirstPilotReadinessStatus = "attention";

  if (input.identityLoadFailed) {
    status = "unknown";
    summary = "Identity diagnostics could not be loaded — open identity providers to verify sign-in.";
    href = "/administration/identity-providers";
    cta = "Open identity providers";
  } else if (input.identity !== null) {
    const overview = resolveIdentityProvidersOverview(input.identity);

    if (identityReady) {
      status = "ready";
      summary = "Corporate sign-in is configured and validated.";
    } else if (overview.usesLocalDevelopmentSignIn) {
      summary = "Development bypass is active — configure production OIDC or SAML before go-live.";
      href = overview.recommendedNextHref ?? "/administration/identity-providers/oidc";
      cta = "Configure production sign-in";
    } else {
      summary = overview.recommendedNextStep;
      href = overview.recommendedNextHref ?? href;
      cta = "Continue identity setup";

      if (overview.oidcStatus === IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW) {
        status = "attention";
      }
    }
  }

  return {
    id: "corporate-sign-in",
    label: "Corporate sign-in (OIDC / SAML)",
    status,
    summary,
    href,
    cta,
    sortOrder: ADMIN_PREREQUISITE_SORT_ORDER.corporateSignIn,
  };
}

function buildAllAdminPrerequisiteRows(input: ResolveAdminPrerequisitesReadinessInput): AdminPrerequisiteRow[] {
  const deployment = input.deployment ?? resolveFinishSetupWizardDeploymentOptions();
  const finishSetupSteps = resolveFinishSetupWizardSteps(deployment);
  const rows: AdminPrerequisiteRow[] = [];

  const healthStep = finishSetupSteps.find((step) => step.id === "health");

  if (healthStep !== undefined) {
    const done = healthStep.isDone(input.finishSetupContext);

    rows.push({
      id: "platform-health",
      label: healthStep.label,
      status: done ? "ready" : input.finishSetupContext.healthLoadFailed ? "unknown" : "blocked",
      summary: healthStep.description,
      href: healthStep.href,
      cta: healthStep.cta,
      sortOrder: ADMIN_PREREQUISITE_SORT_ORDER.platformHealth,
    });
  }

  const configLintCopy = mapConfigLintReadiness({ canAdmin: true, lint: input.configLint });

  if (input.includeHostConfigurationLint === true) {
    rows.push({
      id: "production-config",
      label: "Production-like configuration",
      status: configLintCopy.status,
      summary: configLintCopy.summary,
      href: "/internal/health",
      cta: "Open config lint",
      sortOrder: ADMIN_PREREQUISITE_SORT_ORDER.productionConfig,
    });
  }

  if (!input.cloud.loadFailed) {
    const cloudReady = input.cloud.anyConfigured;

    rows.push({
      id: "cloud-connection",
      label: "Cloud evidence connection",
      status: cloudReady ? "ready" : "attention",
      summary: cloudReady
        ? "At least one Tier 2 cloud connection is configured."
        : "Optional for core reviews — connect Azure, AWS, or GCP when you need inventory-backed evidence.",
      href: CLOUD_CONNECTIONS_PATH,
      cta: "Open cloud connections",
      sortOrder: ADMIN_PREREQUISITE_SORT_ORDER.cloudConnection,
    });
  }

  rows.push(buildCorporateSignInRow(input));

  const adminStep = finishSetupSteps.find((step) => step.id === "admin-role");

  if (adminStep !== undefined) {
    const done = adminStep.isDone(input.finishSetupContext);

    rows.push({
      id: "admin-role",
      label: adminStep.label,
      status: done ? "ready" : "attention",
      summary: adminStep.description,
      href: adminStep.href,
      cta: adminStep.cta,
      sortOrder: ADMIN_PREREQUISITE_SORT_ORDER.adminRole,
    });
  }

  if (input.billing.paymentPastDue) {
    rows.push({
      id: "billing-payment",
      label: "Subscription payment",
      status: "blocked",
      summary: "Payment is past due — update your billing method to avoid service interruption.",
      href: SETTINGS_BILLING_PATH,
      cta: "Manage billing",
      sortOrder: ADMIN_PREREQUISITE_SORT_ORDER.billing,
    });
  }

  return rows.sort((left, right) => left.sortOrder - right.sortOrder);
}

function shouldShowUnmetRow(row: AdminPrerequisiteRow, earlierUnmetRows: readonly AdminPrerequisiteRow[]): boolean {
  if (row.id !== "cloud-connection") {
    return true;
  }

  const blockingEarlier = earlierUnmetRows.some(
    (earlier) => earlier.sortOrder < row.sortOrder
      && (earlier.status === "blocked" || earlier.status === "unknown"),
  );

  return !blockingEarlier;
}

export function filterUnmetAdminPrerequisiteRows(rows: readonly AdminPrerequisiteRow[]): AdminPrerequisiteRow[] {
  const unmetRows = rows.filter((row) => row.status !== "ready");
  const visibleRows: AdminPrerequisiteRow[] = [];

  for (const row of unmetRows) {
    if (shouldShowUnmetRow(row, visibleRows)) {
      visibleRows.push(row);
    }
  }

  return visibleRows;
}

function isMandatoryForTenantReadiness(row: AdminPrerequisiteRow): boolean {
  return !OPTIONAL_READINESS_ROW_IDS.has(row.id);
}

export function resolveAdminPrerequisitesReadiness(input: ResolveAdminPrerequisitesReadinessInput): {
  readonly rows: readonly AdminPrerequisiteRow[];
  readonly allReady: boolean;
} {
  const allRows = buildAllAdminPrerequisiteRows(input);
  const unmetRows = filterUnmetAdminPrerequisiteRows(allRows);
  const mandatoryUnmet = allRows.filter((row) => row.status !== "ready" && isMandatoryForTenantReadiness(row));
  const allReady = mandatoryUnmet.length === 0;

  return {
    rows: allReady ? [] : unmetRows,
    allReady,
  };
}
