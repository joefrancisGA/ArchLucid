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

function readUuidParam(params: URLSearchParams, key: string): string | null {
  const raw = params.get(key);

  if (raw === null) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length > 0 ? trimmed : null;
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

  if (state.selectedFindingId !== null) {
    params.set(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM, state.selectedFindingId);
  } else {
    params.delete(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM);
  }

  if (state.selectedPathId !== null) {
    params.set(REMEDIATION_FACTORY_SELECTED_PATH_PARAM, state.selectedPathId);
  } else {
    params.delete(REMEDIATION_FACTORY_SELECTED_PATH_PARAM);
  }

  if (state.fromSnapshotId !== null) {
    params.set(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM, state.fromSnapshotId);
  } else {
    params.delete(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM);
  }

  if (state.toSnapshotId !== null) {
    params.set(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM, state.toSnapshotId);
  } else {
    params.delete(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM);
  }

  if (state.metricsSummaryOpen) {
    params.set(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM, "1");
  } else {
    params.delete(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM);
  }

  return params;
}

export function remediationFactoryHrefFromSearch(pathname: string, search: string): string {
  const query = search.trim();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
}
