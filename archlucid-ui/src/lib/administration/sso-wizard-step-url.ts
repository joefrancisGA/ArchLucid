export const SSO_WIZARD_PATH = "/administration/identity/sso-wizard" as const;

export const SSO_WIZARD_STEP_PARAM = "step";

const SSO_WIZARD_MAX_STEP_INDEX = 5;

export function parseSsoWizardStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > SSO_WIZARD_MAX_STEP_INDEX) {
    return null;
  }

  return parsed;
}

export function ssoWizardStepHrefFromSearch(
  currentSearch: string,
  stepIndex: number,
  pathname: string = SSO_WIZARD_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (stepIndex <= 0) {
    params.delete(SSO_WIZARD_STEP_PARAM);
  } else {
    params.set(SSO_WIZARD_STEP_PARAM, String(stepIndex));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
