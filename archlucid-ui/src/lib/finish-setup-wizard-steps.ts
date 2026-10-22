import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import { isSelfHostedDeploymentEnv } from "@/lib/finish-setup-deployment";

/** Buyer-safe readiness route (`ReadAuthority`) — not Internal Operations diagnostics. */
export const FINISH_SETUP_SYSTEM_HEALTH_PATH = ADMINISTRATION_SYSTEM_HEALTH_PATH;

const FINISH_SETUP_HEALTH_STEP_ID = "health";
const FINISH_SETUP_OPTIONAL_STEP_IDS = new Set<string>(["identity"]);

export type FinishSetupWizardContext = {
  readonly healthReady: boolean;
  readonly healthLoadFailed: boolean;
  readonly principalAdmin: boolean;
  /** `true` when corporate OIDC/SAML is configured; `null` when diagnostics are unavailable. */
  readonly identityConfigured?: boolean | null;
};

export type FinishSetupWizardStep = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly cta: string;
  readonly isDone: (ctx: FinishSetupWizardContext) => boolean;
};

export const FINISH_SETUP_WIZARD_STEPS: readonly FinishSetupWizardStep[] = [
  {
    id: FINISH_SETUP_HEALTH_STEP_ID,
    label: "Confirm platform health",
    description:
      "Required for self-hosted deployments before your first review. API and database migrations must be healthy.",
    href: FINISH_SETUP_SYSTEM_HEALTH_PATH,
    cta: "Open system health",
    isDone: (ctx) => ctx.healthReady && !ctx.healthLoadFailed,
  },
  {
    id: "identity",
    label: "Configure identity (OIDC / SAML)",
    description: "Wire your IdP so operators sign in with corporate credentials.",
    href: "/administration/identity/sso-wizard",
    cta: "Open SSO wizard",
    isDone: (ctx) => ctx.identityConfigured === true,
  },
  {
    id: "admin-role",
    label: "Assign initial Admin role",
    description: "Grant at least one operator Admin authority for tenant settings and SCIM.",
    href: SETTINGS_USERS_PATH,
    cta: "Manage roles",
    isDone: (ctx) => ctx.principalAdmin,
  },
] as const;

export type FinishSetupWizardDeploymentOptions = {
  readonly selfHosted: boolean;
};

export function resolveFinishSetupWizardDeploymentOptions(): FinishSetupWizardDeploymentOptions {
  return {
    selfHosted: isSelfHostedDeploymentEnv(),
  };
}

/** Health confirmation applies only on self-hosted stacks — hide on managed SaaS onboarding hubs. */
export function resolveFinishSetupWizardSteps(
  deployment: FinishSetupWizardDeploymentOptions = resolveFinishSetupWizardDeploymentOptions(),
): readonly FinishSetupWizardStep[] {
  if (deployment.selfHosted) {
    return FINISH_SETUP_WIZARD_STEPS;
  }

  return FINISH_SETUP_WIZARD_STEPS.filter((step) => step.id !== FINISH_SETUP_HEALTH_STEP_ID);
}

export function countFinishSetupReadySteps(
  ctx: FinishSetupWizardContext,
  deployment: FinishSetupWizardDeploymentOptions = resolveFinishSetupWizardDeploymentOptions(),
): { readonly ready: number; readonly total: number } {
  const steps = resolveFinishSetupWizardSteps(deployment);
  const ready = steps.filter((step) => step.isDone(ctx)).length;

  return {
    ready,
    total: steps.length,
  };
}

export function areFinishSetupRequiredStepsComplete(
  ctx: FinishSetupWizardContext,
  deployment: FinishSetupWizardDeploymentOptions = resolveFinishSetupWizardDeploymentOptions(),
): boolean {
  return resolveFinishSetupWizardSteps(deployment)
    .filter((step) => !FINISH_SETUP_OPTIONAL_STEP_IDS.has(step.id))
    .every((step) => step.isDone(ctx));
}
