export const SSO_WIZARD_PATH = "/administration/identity/sso-wizard" as const;

export const SSO_WIZARD_STEP_PARAM = "step";
export const SSO_WIZARD_CANCEL_CONFIRM_PARAM = "ssoCancelConfirm";

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

export function parseSsoWizardCancelConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export type SsoWizardUrlState = {
  readonly stepIndex: number;
  readonly cancelConfirmOpen: boolean;
};

export function ssoWizardStepHrefFromSearch(
  currentSearch: string,
  stepIndex: number,
  pathname: string = SSO_WIZARD_PATH,
): string {
  const cancelConfirmOpen = parseSsoWizardCancelConfirmOpenFromSearch(
    new URLSearchParams(currentSearch).get(SSO_WIZARD_CANCEL_CONFIRM_PARAM),
  );

  return ssoWizardHrefFromSearch(currentSearch, { stepIndex, cancelConfirmOpen }, pathname);
}

export function ssoWizardHrefFromSearch(
  currentSearch: string,
  state: SsoWizardUrlState,
  pathname: string = SSO_WIZARD_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (state.stepIndex <= 0) {
    params.delete(SSO_WIZARD_STEP_PARAM);
  } else {
    params.set(SSO_WIZARD_STEP_PARAM, String(state.stepIndex));
  }

  if (!state.cancelConfirmOpen) {
    params.delete(SSO_WIZARD_CANCEL_CONFIRM_PARAM);
  } else {
    params.set(SSO_WIZARD_CANCEL_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
