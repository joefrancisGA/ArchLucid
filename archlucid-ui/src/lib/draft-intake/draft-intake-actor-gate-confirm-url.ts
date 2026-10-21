import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, confirmOpen, pathname, DRAFT_INTAKE_ACTOR_GATE_CONFIRM_PARAM);
}
