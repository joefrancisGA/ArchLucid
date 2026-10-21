import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import type { AlertSimulationModeTabId } from "@/lib/alert-simulation-form";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const ALERT_SIMULATION_MODE_PARAM = "simMode";

const ALERT_SIMULATION_MODE_IDS = new Set<string>(["simple", "composite", "compare"]);

export function parseAlertSimulationModeFromSearch(raw: string | null | undefined): AlertSimulationModeTabId {
  if (raw === null || raw === undefined) {
    return "simple";
  }

  const trimmed = raw.trim().toLowerCase();

  if (!ALERT_SIMULATION_MODE_IDS.has(trimmed)) {
    return "simple";
  }

  return trimmed as AlertSimulationModeTabId;
}

export function alertSimulationModeHrefFromSearch(
  currentSearch: string,
  mode: AlertSimulationModeTabId,
  pathname: string = GOVERNANCE_ALERT_RULES_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (mode === "simple") {
      params.delete(ALERT_SIMULATION_MODE_PARAM);
    } else {
      params.set(ALERT_SIMULATION_MODE_PARAM, mode);
    }
    },
  });
}
