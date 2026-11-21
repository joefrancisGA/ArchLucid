import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const REMEDIATION_FACTORY_SELECTED_FINDING_PARAM = "selectedFinding" as const;
export const REMEDIATION_FACTORY_SELECTED_PATH_PARAM = "selectedPath" as const;
export const REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM = "fromSnapshot" as const;
export const REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM = "toSnapshot" as const;
export const REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM = "remediationFactoryMetricsOpen" as const;

export type RemediationFactoryUrlState = {
  readonly selectedFindingId: string | null;
  readonly selectedPathId: string | null;
  readonly fromSnapshotId: string | null;
  readonly toSnapshotId: string | null;
  readonly metricsSummaryOpen: boolean;
};

function normalizeUuidQueryValue(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function readUuidParam(params: URLSearchParams, key: string): string | null {
  return normalizeUuidQueryValue(params.get(key));
}

function setUuidParam(params: URLSearchParams, key: string, value: string | null): void {
  const normalized = normalizeUuidQueryValue(value);

  if (normalized !== null) {
    params.set(key, normalized);
  } else {
    params.delete(key);
  }
}

export function parseRemediationFactoryUrlStateFromSearch(search: string): RemediationFactoryUrlState {
  const params = new URLSearchParams(search);
  const metricsOpenRaw = params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)?.trim().toLowerCase();

  return {
    selectedFindingId: readUuidParam(params, REMEDIATION_FACTORY_SELECTED_FINDING_PARAM),
    selectedPathId: readUuidParam(params, REMEDIATION_FACTORY_SELECTED_PATH_PARAM),
    fromSnapshotId: readUuidParam(params, REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM),
    toSnapshotId: readUuidParam(params, REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM),
    metricsSummaryOpen: metricsOpenRaw === "1" || metricsOpenRaw === "true",
  };
}

export function remediationFactoryUrlStateToSearchParams(
  state: RemediationFactoryUrlState,
  baseSearch = "",
): URLSearchParams {
  const params = new URLSearchParams(baseSearch);

  setUuidParam(params, REMEDIATION_FACTORY_SELECTED_FINDING_PARAM, state.selectedFindingId);
  setUuidParam(params, REMEDIATION_FACTORY_SELECTED_PATH_PARAM, state.selectedPathId);
  setUuidParam(params, REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM, state.fromSnapshotId);
  setUuidParam(params, REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM, state.toSnapshotId);

  if (state.metricsSummaryOpen) {
    params.set(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM, "1");
  } else {
    params.delete(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM);
  }

  return params;
}

export function remediationFactoryHrefFromSearch(pathname: string, search: string): string {
  return buildOperatorHrefFromSearch(search, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: () => {},
  });
}