export const ROOT_CAUSE_CLUSTER_KEY_PARAM = "clusterKey";
export const ROOT_CAUSE_CLUSTER_DISP_PARAM = "clusterDisp";

export const ROOT_CAUSE_CLUSTER_DISP_OPTIONS = ["accepted", "waived"] as const;

export type RootCauseClusterDispositionUrlValue = (typeof ROOT_CAUSE_CLUSTER_DISP_OPTIONS)[number];

export type RootCauseClusterDispositionKind = "Accepted" | "RejectedAsNotApplicable";

const ROOT_CAUSE_CLUSTER_DISP_IDS = new Set<string>(ROOT_CAUSE_CLUSTER_DISP_OPTIONS);

export type RootCauseClusterDispositionUrlState = {
  readonly clusterKey: string | null;
  readonly disposition: RootCauseClusterDispositionKind | null;
};

export function parseRootCauseClusterKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseRootCauseClusterDispFromSearch(
  raw: string | null | undefined,
): RootCauseClusterDispositionUrlValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!ROOT_CAUSE_CLUSTER_DISP_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as RootCauseClusterDispositionUrlValue;
}

export function rootCauseClusterDispositionToUrlValue(
  disposition: RootCauseClusterDispositionKind,
): RootCauseClusterDispositionUrlValue {
  return disposition === "Accepted" ? "accepted" : "waived";
}

export function rootCauseClusterDispositionFromUrlValue(
  value: RootCauseClusterDispositionUrlValue,
): RootCauseClusterDispositionKind {
  return value === "accepted" ? "Accepted" : "RejectedAsNotApplicable";
}

export function rootCauseClusterDispositionHrefFromSearch(
  currentSearch: string,
  state: RootCauseClusterDispositionUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const clusterKey = (state.clusterKey ?? "").trim();

  if (clusterKey.length === 0 || state.disposition === null) {
    params.delete(ROOT_CAUSE_CLUSTER_KEY_PARAM);
    params.delete(ROOT_CAUSE_CLUSTER_DISP_PARAM);
  } else {
    params.set(ROOT_CAUSE_CLUSTER_KEY_PARAM, clusterKey);
    params.set(ROOT_CAUSE_CLUSTER_DISP_PARAM, rootCauseClusterDispositionToUrlValue(state.disposition));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
