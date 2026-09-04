import type { WizardSessionId } from "@/lib/wizard-session-persistence";

export const WIZARD_SESSION_RESTORE_CONFIRM_PARAM = "wizardRestoreConfirm";
export const WIZARD_SESSION_RESTORE_ID_PARAM = "wizardRestoreId";

export type WizardSessionRestoreConfirmUrlState = {
  readonly confirmOpen: boolean;
  readonly wizardId: WizardSessionId | null;
};

export function parseWizardSessionRestoreConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseWizardSessionRestoreIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function wizardSessionRestoreConfirmHrefFromSearch(
  currentSearch: string,
  state: WizardSessionRestoreConfirmUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const wizardId = (state.wizardId ?? "").trim();

  if (!state.confirmOpen || wizardId.length === 0) {
    params.delete(WIZARD_SESSION_RESTORE_CONFIRM_PARAM);
    params.delete(WIZARD_SESSION_RESTORE_ID_PARAM);
  } else {
    params.set(WIZARD_SESSION_RESTORE_CONFIRM_PARAM, "1");
    params.set(WIZARD_SESSION_RESTORE_ID_PARAM, wizardId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
