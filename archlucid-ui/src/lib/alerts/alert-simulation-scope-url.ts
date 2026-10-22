import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const ALERT_SIMULATION_RUN_ID_PARAM = "simRunId";
export const ALERT_SIMULATION_COMPARE_RUN_PARAM = "simCompareRun";
export const ALERT_SIMULATION_SLUG_PARAM = "simSlug";

export type AlertSimulationScopeUrlState = {
  readonly runId: string;
  readonly compareRunId: string;
  readonly projectSlug: string;
};

export function parseAlertSimulationRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAlertSimulationCompareRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAlertSimulationProjectSlugFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function alertSimulationScopeHrefFromSearch(
  currentSearch: string,
  state: AlertSimulationScopeUrlState,
  pathname: string = GOVERNANCE_ALERT_RULES_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const runId = state.runId.trim();
    const compareRunId = state.compareRunId.trim();
    const projectSlug = state.projectSlug.trim();

    if (runId.length === 0) {
      params.delete(ALERT_SIMULATION_RUN_ID_PARAM);
    } else {
      params.set(ALERT_SIMULATION_RUN_ID_PARAM, runId);
    }

    if (compareRunId.length === 0) {
      params.delete(ALERT_SIMULATION_COMPARE_RUN_PARAM);
    } else {
      params.set(ALERT_SIMULATION_COMPARE_RUN_PARAM, compareRunId);
    }

    if (projectSlug.length === 0) {
      params.delete(ALERT_SIMULATION_SLUG_PARAM);
    } else {
      params.set(ALERT_SIMULATION_SLUG_PARAM, projectSlug);
    }
    },
  });
}
