import type { ItsmOnboardingWizardStep } from "@/lib/itsm/itsm-native-create-readiness";

export const ITSM_ONBOARDING_WIZARD_PATH = "/internal/integrations/itsm" as const;

export const ITSM_ONBOARDING_WIZARD_STEP_PARAM = "itsmStep";

export const ITSM_ONBOARDING_WIZARD_STEP_OPTIONS = [
  "prerequisites",
  "settings",
  "verify",
  "runbooks",
] as const satisfies readonly ItsmOnboardingWizardStep[];

const ITSM_ONBOARDING_WIZARD_STEP_IDS = new Set<string>(ITSM_ONBOARDING_WIZARD_STEP_OPTIONS);

export function parseItsmOnboardingWizardStepFromSearch(
  raw: string | null | undefined,
): ItsmOnboardingWizardStep | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!ITSM_ONBOARDING_WIZARD_STEP_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as ItsmOnboardingWizardStep;
}

export function itsmOnboardingWizardStepHrefFromSearch(
  currentSearch: string,
  step: ItsmOnboardingWizardStep | null,
  pathname: string = ITSM_ONBOARDING_WIZARD_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (step === null || step === "prerequisites") {
    params.delete(ITSM_ONBOARDING_WIZARD_STEP_PARAM);
  } else {
    params.set(ITSM_ONBOARDING_WIZARD_STEP_PARAM, step);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
