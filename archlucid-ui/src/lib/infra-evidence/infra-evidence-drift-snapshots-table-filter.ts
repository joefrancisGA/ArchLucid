import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  formatInfraEvidenceSnapshotCapturedLabel,
  formatInfraEvidenceSubscriptionLabel,
} from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";

export const DRIFT_SNAPSHOTS_TABLE_SUBSCRIPTION_FILTER_PARAM = "snapshotSubscription";
export const DRIFT_SNAPSHOTS_TABLE_CAPTURED_FILTER_PARAM = "snapshotCaptured";
export const DRIFT_SNAPSHOTS_TABLE_RESOURCES_FILTER_PARAM = "snapshotResources";
export const DRIFT_SNAPSHOTS_TABLE_RELATIONSHIPS_FILTER_PARAM = "snapshotRelationships";
export const DRIFT_SNAPSHOTS_TABLE_SORT_BY_PARAM = "snapshotSortBy";
export const DRIFT_SNAPSHOTS_TABLE_SORT_DIR_PARAM = "snapshotSortDir";

export type DriftSnapshotsTableSortKey = "subscription" | "captured" | "resources" | "relationships";
export type DriftSnapshotsTableSortDir = "asc" | "desc";

export type DriftSnapshotsTableFilterState = {
  readonly subscriptionFilter: string;
  readonly capturedFilter: string;
  readonly resourcesFilter: string;
  readonly relationshipsFilter: string;
  readonly sortBy: DriftSnapshotsTableSortKey;
  readonly sortDir: DriftSnapshotsTableSortDir;
};

export const DEFAULT_DRIFT_SNAPSHOTS_TABLE_FILTER_STATE: DriftSnapshotsTableFilterState = {
  subscriptionFilter: "",
  capturedFilter: "",
  resourcesFilter: "",
  relationshipsFilter: "",
  sortBy: "captured",
  sortDir: "desc",
};

const SORT_KEYS: readonly DriftSnapshotsTableSortKey[] = [
  "subscription",
  "captured",
  "resources",
  "relationships",
];

function parseSortKey(raw: string | null | undefined): DriftSnapshotsTableSortKey {
  const trimmed = raw?.trim() ?? "";

  return SORT_KEYS.includes(trimmed as DriftSnapshotsTableSortKey)
    ? (trimmed as DriftSnapshotsTableSortKey)
    : DEFAULT_DRIFT_SNAPSHOTS_TABLE_FILTER_STATE.sortBy;
}

function parseSortDir(raw: string | null | undefined): DriftSnapshotsTableSortDir {
  return raw?.trim().toLowerCase() === "asc" ? "asc" : "desc";
}

export function parseDriftSnapshotsTableFilterState(searchParams: URLSearchParams): DriftSnapshotsTableFilterState {
  return {
    subscriptionFilter: searchParams.get(DRIFT_SNAPSHOTS_TABLE_SUBSCRIPTION_FILTER_PARAM)?.trim() ?? "",
    capturedFilter: searchParams.get(DRIFT_SNAPSHOTS_TABLE_CAPTURED_FILTER_PARAM)?.trim() ?? "",
    resourcesFilter: searchParams.get(DRIFT_SNAPSHOTS_TABLE_RESOURCES_FILTER_PARAM)?.trim() ?? "",
    relationshipsFilter: searchParams.get(DRIFT_SNAPSHOTS_TABLE_RELATIONSHIPS_FILTER_PARAM)?.trim() ?? "",
    sortBy: parseSortKey(searchParams.get(DRIFT_SNAPSHOTS_TABLE_SORT_BY_PARAM)),
    sortDir: parseSortDir(searchParams.get(DRIFT_SNAPSHOTS_TABLE_SORT_DIR_PARAM)),
  };
}

export function buildDriftSnapshotsTableFilterPatch(
  current: DriftSnapshotsTableFilterState,
  patch: Partial<DriftSnapshotsTableFilterState>,
): DriftSnapshotsTableFilterState {
  return {
    subscriptionFilter: patch.subscriptionFilter ?? current.subscriptionFilter,
    capturedFilter: patch.capturedFilter ?? current.capturedFilter,
    resourcesFilter: patch.resourcesFilter ?? current.resourcesFilter,
    relationshipsFilter: patch.relationshipsFilter ?? current.relationshipsFilter,
    sortBy: patch.sortBy ?? current.sortBy,
    sortDir: patch.sortDir ?? current.sortDir,
  };
}

export function driftSnapshotsTableFilterSearchParams(state: DriftSnapshotsTableFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.subscriptionFilter.length > 0) {
    params.set(DRIFT_SNAPSHOTS_TABLE_SUBSCRIPTION_FILTER_PARAM, state.subscriptionFilter);
  }

  if (state.capturedFilter.length > 0) {
    params.set(DRIFT_SNAPSHOTS_TABLE_CAPTURED_FILTER_PARAM, state.capturedFilter);
  }

  if (state.resourcesFilter.length > 0) {
    params.set(DRIFT_SNAPSHOTS_TABLE_RESOURCES_FILTER_PARAM, state.resourcesFilter);
  }

  if (state.relationshipsFilter.length > 0) {
    params.set(DRIFT_SNAPSHOTS_TABLE_RELATIONSHIPS_FILTER_PARAM, state.relationshipsFilter);
  }

  if (state.sortBy !== DEFAULT_DRIFT_SNAPSHOTS_TABLE_FILTER_STATE.sortBy) {
    params.set(DRIFT_SNAPSHOTS_TABLE_SORT_BY_PARAM, state.sortBy);
  }

  if (state.sortDir !== DEFAULT_DRIFT_SNAPSHOTS_TABLE_FILTER_STATE.sortDir) {
    params.set(DRIFT_SNAPSHOTS_TABLE_SORT_DIR_PARAM, state.sortDir);
  }

  return params;
}

export function hasActiveDriftSnapshotsTableFilters(
  state: Pick<
    DriftSnapshotsTableFilterState,
    "subscriptionFilter" | "capturedFilter" | "resourcesFilter" | "relationshipsFilter"
  >,
): boolean {
  return (
    state.subscriptionFilter.trim().length > 0
    || state.capturedFilter.trim().length > 0
    || state.resourcesFilter.trim().length > 0
    || state.relationshipsFilter.trim().length > 0
  );
}

export function clearDriftSnapshotsTableFilters(
  state: DriftSnapshotsTableFilterState,
): DriftSnapshotsTableFilterState {
  return {
    ...state,
    subscriptionFilter: "",
    capturedFilter: "",
    resourcesFilter: "",
    relationshipsFilter: "",
  };
}

function snapshotSubscriptionLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  return formatInfraEvidenceSubscriptionLabel(snapshot.subscriptionName, snapshot.subscriptionId) ?? "";
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

function compareNumbers(left: number, right: number): number {
  return left - right;
}

export function sortDriftSnapshots(
  rows: readonly InfraEvidenceSnapshotSummary[],
  sortBy: DriftSnapshotsTableSortKey,
  sortDir: DriftSnapshotsTableSortDir,
): InfraEvidenceSnapshotSummary[] {
  const direction = sortDir === "desc" ? -1 : 1;
  const sorted = [...rows];

  sorted.sort((left, right) => {
    let result = 0;

    switch (sortBy) {
      case "subscription":
        result = compareStrings(snapshotSubscriptionLabel(left), snapshotSubscriptionLabel(right));
        break;

      case "captured":
        result = compareStrings(left.capturedUtc ?? "", right.capturedUtc ?? "");
        break;

      case "resources":
        result = compareNumbers(left.resourceCount, right.resourceCount);
        break;

      case "relationships":
        result = compareNumbers(left.relationshipCount, right.relationshipCount);
        break;

      default: {
        const exhaustive: never = sortBy;
        result = exhaustive;
        break;
      }
    }

    return result * direction;
  });

  return sorted;
}

export function filterDriftSnapshots(
  rows: readonly InfraEvidenceSnapshotSummary[],
  state: Pick<
    DriftSnapshotsTableFilterState,
    "subscriptionFilter" | "capturedFilter" | "resourcesFilter" | "relationshipsFilter"
  >,
): InfraEvidenceSnapshotSummary[] {
  const subscriptionNeedle = state.subscriptionFilter.trim().toLowerCase();
  const capturedNeedle = state.capturedFilter.trim().toLowerCase();
  const resourcesNeedle = state.resourcesFilter.trim();
  const relationshipsNeedle = state.relationshipsFilter.trim();

  return rows.filter((row) => {
    if (subscriptionNeedle.length > 0) {
      const haystack = snapshotSubscriptionLabel(row).toLowerCase();

      if (!haystack.includes(subscriptionNeedle)) {
        return false;
      }
    }

    if (capturedNeedle.length > 0) {
      const capturedLabel = formatInfraEvidenceSnapshotCapturedLabel(row.capturedUtc).toLowerCase();

      if (!capturedLabel.includes(capturedNeedle)) {
        return false;
      }
    }

    if (resourcesNeedle.length > 0) {
      if (!String(row.resourceCount).includes(resourcesNeedle)) {
        return false;
      }
    }

    if (relationshipsNeedle.length > 0) {
      if (!String(row.relationshipCount).includes(relationshipsNeedle)) {
        return false;
      }
    }

    return true;
  });
}

export function toggleDriftSnapshotsTableSort(
  current: DriftSnapshotsTableFilterState,
  nextSortBy: DriftSnapshotsTableSortKey,
): DriftSnapshotsTableFilterState {
  if (current.sortBy === nextSortBy) {
    return {
      ...current,
      sortDir: current.sortDir === "asc" ? "desc" : "asc",
    };
  }

  return {
    ...current,
    sortBy: nextSortBy,
    sortDir: "asc",
  };
}
