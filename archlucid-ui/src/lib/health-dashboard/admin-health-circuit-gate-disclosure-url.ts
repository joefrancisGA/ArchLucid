import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ADMIN_HEALTH_CIRCUIT_GATE_ID_PARAM = "adminHealthCircuitGateId";

export function parseAdminHealthCircuitGateIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function adminHealthCircuitGateDisclosureHrefFromSearch(
  currentSearch: string,
  gateId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (gateId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(ADMIN_HEALTH_CIRCUIT_GATE_ID_PARAM);
    } else {
      params.set(ADMIN_HEALTH_CIRCUIT_GATE_ID_PARAM, trimmed);
    }
    },
  });
}
