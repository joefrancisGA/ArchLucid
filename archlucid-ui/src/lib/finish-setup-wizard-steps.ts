import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

export type FinishSetupWizardContext = {
  readonly healthReady: boolean;
  readonly healthLoadFailed: boolean;
  readonly principalAdmin: boolean;
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
    id: "health",
    label: "Confirm platform health",
    description:
      "Required for self-hosted deployments before your first review. API and database migrations must be healthy.",
    href: "/admin/health",
    cta: "Open health",
    isDone: (ctx) => ctx.healthReady && !ctx.healthLoadFailed,
  },
  {
    id: "identity",
    label: "Configure identity (OIDC / SAML)",
    description: "Wire your IdP so operators sign in with corporate credentials.",
    href: "/settings/identity/sso-wizard",
    cta: "Open SSO wizard",
    isDone: () => false,
  },
  {
    id: "admin-role",
    label: "Assign initial Admin role",
    description: "Grant at least one operator Admin authority for tenant settings and SCIM.",
    href: SETTINGS_USERS_PATH,
    cta: "Manage roles",
    isDone: (ctx) => ctx.principalAdmin,
  },
  {
    id: "extract",
    label: "Add Azure export evidence (optional)",
    description:
      "Optional accelerator: upload an Azure extractor ZIP for production-faithful subscription inventory.",
    href: "/settings/extract-upload",
    cta: "Add evidence",
    isDone: () => false,
  },
] as const;

export function countFinishSetupReadySteps(ctx: FinishSetupWizardContext): { readonly ready: number; readonly total: number } {
  const ready = FINISH_SETUP_WIZARD_STEPS.filter((step) => step.isDone(ctx)).length;

  return {
    ready,
    total: FINISH_SETUP_WIZARD_STEPS.length,
  };
}

export function areFinishSetupRequiredStepsComplete(ctx: FinishSetupWizardContext): boolean {
  return FINISH_SETUP_WIZARD_STEPS.filter((step) => step.id !== "extract").every((step) => step.isDone(ctx));
}
