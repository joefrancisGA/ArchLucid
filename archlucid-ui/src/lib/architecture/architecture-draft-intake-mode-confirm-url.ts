export const ARCHITECTURE_DRAFT_INTAKE_MODE_CONFIRM_PARAM = "intakeModeConfirm";
export const ARCHITECTURE_DRAFT_INTAKE_MODE_DRAFT_ID_PARAM = "intakeModeDraftId";

export function parseArchitectureDraftIntakeModeConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseArchitectureDraftIntakeModeDraftIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export type ArchitectureDraftIntakeModeConfirmUrlState = {
  readonly confirmOpen: boolean;
  readonly draftId: string | null;
};

export function architectureDraftIntakeModeConfirmHrefFromSearch(
  currentSearch: string,
  state: ArchitectureDraftIntakeModeConfirmUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const draftId = (state.draftId ?? "").trim();

  if (!state.confirmOpen || draftId.length === 0) {
    params.delete(ARCHITECTURE_DRAFT_INTAKE_MODE_CONFIRM_PARAM);
    params.delete(ARCHITECTURE_DRAFT_INTAKE_MODE_DRAFT_ID_PARAM);
  } else {
    params.set(ARCHITECTURE_DRAFT_INTAKE_MODE_CONFIRM_PARAM, "1");
    params.set(ARCHITECTURE_DRAFT_INTAKE_MODE_DRAFT_ID_PARAM, draftId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
