export const DRAFT_INTAKE_ACTOR_GATE_CONFIRM_PARAM = "actorGateConfirm";

export function parseDraftIntakeActorGateConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function draftIntakeActorGateConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(DRAFT_INTAKE_ACTOR_GATE_CONFIRM_PARAM);
  } else {
    params.set(DRAFT_INTAKE_ACTOR_GATE_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
