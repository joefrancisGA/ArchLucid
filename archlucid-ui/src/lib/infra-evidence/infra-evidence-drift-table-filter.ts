import type { InfraEvidenceDiffChange, InfraEvidenceDiffSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  formatInfraEvidenceChangeTypeLabel,
  isInfraEvidenceResourceRemovedChange,
  normalizeInfraEvidenceChangeTypeKey,
} from "@/lib/infra-evidence/infra-evidence-drift-display";
import { formatAzureResourceDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import {
  formatInfraEvidenceDriftRiskLabel,
  isComparingTwoInventorySnapshots,
  resolveInfraEvidenceDriftRiskKey,
} from "@/lib/infra-evidence/infra-evidence-drift-risk-display";
import { suppressNestedResourceRemovedChanges } from "@/lib/infra-evidence/suppress-nested-resource-removed-changes";

export const DRIFT_TABLE_RISK_FILTER_PARAM = "risk";
export const DRIFT_TABLE_CHANGE_TYPE_FILTER_PARAM = "changeType";
export const DRIFT_TABLE_RESOURCE_FILTER_PARAM = "resource";
export const DRIFT_TABLE_RESOURCE_GROUP_FILTER_PARAM = "resourceGroup";
export const DRIFT_TABLE_RESOURCE_TYPE_FILTER_PARAM = "resourceType";
export const DRIFT_TABLE_PROPERTY_FILTER_PARAM = "property";
export const DRIFT_TABLE_SORT_BY_PARAM = "sortBy";
export const DRIFT_TABLE_SORT_DIR_PARAM = "sortDir";
export const DRIFT_TABLE_CHANGES_PAGE_PARAM = "changesPage";
export const DRIFT_SNAPSHOTS_PAGE_PARAM = "snapshotsPage";

export type DriftTableSortKey =
  | "resource"
  | "resourceGroup"
  | "resourceType"
  | "change"
  | "property"
  | "risk";
export type DriftTableSortDir = "asc" | "desc";

export type DriftTableFilterState = {
  readonly riskFilter: string;
  readonly changeTypeFilter: string;
  readonly resourceFilter: string;
  readonly resourceGroupFilter: string;
  readonly resourceTypeFilter: string;
  readonly propertyFilter: string;
  readonly sortBy: DriftTableSortKey;
  readonly sortDir: DriftTableSortDir;
  readonly changesPage: number;
  readonly snapshotsPage: number;
};

export const DEFAULT_DRIFT_TABLE_FILTER_STATE: DriftTableFilterState = {
  riskFilter: "",
  changeTypeFilter: "",
  resourceFilter: "",
  resourceGroupFilter: "",
  resourceTypeFilter: "",
  propertyFilter: "",
  sortBy: "resource",
  sortDir: "asc",
  changesPage: 1,
  snapshotsPage: 1,
};

const SORT_KEYS: readonly DriftTableSortKey[] = [
  "resource",
  "resourceGroup",
  "resourceType",
  "change",
  "property",
  "risk",
];

export function parseDriftTableSortKey(raw: string | null | undefined): DriftTableSortKey {
  const trimmed = raw?.trim() ?? "";

  return SORT_KEYS.includes(trimmed as DriftTableSortKey) ? (trimmed as DriftTableSortKey) : "resource";
}

export function parseDriftTableSortDir(raw: string | null | undefined): DriftTableSortDir {
  return raw?.trim().toLowerCase() === "desc" ? "desc" : "asc";
}

export function parseDriftTablePositiveInt(raw: string | null | undefined, fallback = 1): number {
  const parsed = Number.parseInt(raw?.trim() ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function parseDriftTableFilterState(searchParams: URLSearchParams): DriftTableFilterState {
  return {
    riskFilter: searchParams.get(DRIFT_TABLE_RISK_FILTER_PARAM)?.trim() ?? "",
    changeTypeFilter: searchParams.get(DRIFT_TABLE_CHANGE_TYPE_FILTER_PARAM)?.trim() ?? "",
    resourceFilter: searchParams.get(DRIFT_TABLE_RESOURCE_FILTER_PARAM)?.trim() ?? "",
    resourceGroupFilter: searchParams.get(DRIFT_TABLE_RESOURCE_GROUP_FILTER_PARAM)?.trim() ?? "",
    resourceTypeFilter: searchParams.get(DRIFT_TABLE_RESOURCE_TYPE_FILTER_PARAM)?.trim() ?? "",
    propertyFilter: searchParams.get(DRIFT_TABLE_PROPERTY_FILTER_PARAM)?.trim() ?? "",
    sortBy: parseDriftTableSortKey(searchParams.get(DRIFT_TABLE_SORT_BY_PARAM)),
    sortDir: parseDriftTableSortDir(searchParams.get(DRIFT_TABLE_SORT_DIR_PARAM)),
    changesPage: parseDriftTablePositiveInt(searchParams.get(DRIFT_TABLE_CHANGES_PAGE_PARAM)),
    snapshotsPage: parseDriftTablePositiveInt(searchParams.get(DRIFT_SNAPSHOTS_PAGE_PARAM)),
  };
}

export function buildDriftTableFilterPatch(
  current: DriftTableFilterState,
  patch: Partial<DriftTableFilterState>,
): DriftTableFilterState {
  return {
    riskFilter: patch.riskFilter ?? current.riskFilter,
    changeTypeFilter: patch.changeTypeFilter ?? current.changeTypeFilter,
    resourceFilter: patch.resourceFilter ?? current.resourceFilter,
    resourceGroupFilter: patch.resourceGroupFilter ?? current.resourceGroupFilter,
    resourceTypeFilter: patch.resourceTypeFilter ?? current.resourceTypeFilter,
    propertyFilter: patch.propertyFilter ?? current.propertyFilter,
    sortBy: patch.sortBy ?? current.sortBy,
    sortDir: patch.sortDir ?? current.sortDir,
    changesPage: patch.changesPage ?? current.changesPage,
    snapshotsPage: patch.snapshotsPage ?? current.snapshotsPage,
  };
}

export function driftTableFilterSearchParams(state: DriftTableFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.riskFilter.length > 0) {
    params.set(DRIFT_TABLE_RISK_FILTER_PARAM, state.riskFilter);
  }

  if (state.changeTypeFilter.length > 0) {
    params.set(DRIFT_TABLE_CHANGE_TYPE_FILTER_PARAM, state.changeTypeFilter);
  }

  if (state.resourceFilter.length > 0) {
    params.set(DRIFT_TABLE_RESOURCE_FILTER_PARAM, state.resourceFilter);
  }

  if (state.resourceGroupFilter.length > 0) {
    params.set(DRIFT_TABLE_RESOURCE_GROUP_FILTER_PARAM, state.resourceGroupFilter);
  }

  if (state.resourceTypeFilter.length > 0) {
    params.set(DRIFT_TABLE_RESOURCE_TYPE_FILTER_PARAM, state.resourceTypeFilter);
  }

  if (state.propertyFilter.length > 0) {
    params.set(DRIFT_TABLE_PROPERTY_FILTER_PARAM, state.propertyFilter);
  }

  if (state.sortBy !== DEFAULT_DRIFT_TABLE_FILTER_STATE.sortBy) {
    params.set(DRIFT_TABLE_SORT_BY_PARAM, state.sortBy);
  }

  if (state.sortDir !== DEFAULT_DRIFT_TABLE_FILTER_STATE.sortDir) {
    params.set(DRIFT_TABLE_SORT_DIR_PARAM, state.sortDir);
  }

  if (state.changesPage > 1) {
    params.set(DRIFT_TABLE_CHANGES_PAGE_PARAM, String(state.changesPage));
  }

  if (state.snapshotsPage > 1) {
    params.set(DRIFT_SNAPSHOTS_PAGE_PARAM, String(state.snapshotsPage));
  }

  return params;
}

function compareStrings(left: string | null | undefined, right: string | null | undefined): number {
  return (left ?? "").localeCompare(right ?? "", undefined, { sensitivity: "base" });
}

function resourceTypeHaystack(azureResourceId: string | null | undefined): string {
  const trimmed = azureResourceId?.trim() ?? "";

  if (trimmed.length === 0) {
    return "";
  }

  const display = formatAzureResourceDisplay(trimmed);
  const segments = trimmed.split("/").filter((segment) => segment.length > 0);
  const providersIndex = segments.findIndex((segment) => segment.toLowerCase() === "providers");
  let providerQualifiedType = "";

  if (providersIndex >= 0 && segments.length >= providersIndex + 3) {
    providerQualifiedType = `${segments[providersIndex + 1]}/${segments[providersIndex + 2]}`;
  }

  return `${display.resourceType ?? ""} ${providerQualifiedType}`.trim().toLowerCase();
}

export function hasActiveDriftTableFilters(
  state: Pick<
    DriftTableFilterState,
    | "riskFilter"
    | "changeTypeFilter"
    | "resourceFilter"
    | "resourceGroupFilter"
    | "resourceTypeFilter"
    | "propertyFilter"
  >,
): boolean {
  return (
    state.riskFilter.trim().length > 0
    || state.changeTypeFilter.trim().length > 0
    || state.resourceFilter.trim().length > 0
    || state.resourceGroupFilter.trim().length > 0
    || state.resourceTypeFilter.trim().length > 0
    || state.propertyFilter.trim().length > 0
  );
}

export function clearDriftTableFilters(
  state: DriftTableFilterState,
): DriftTableFilterState {
  return {
    ...state,
    riskFilter: "",
    changeTypeFilter: "",
    resourceFilter: "",
    resourceGroupFilter: "",
    resourceTypeFilter: "",
    propertyFilter: "",
    changesPage: 1,
  };
}

export function sortDriftChanges(
  rows: readonly InfraEvidenceDiffChange[],
  sortBy: DriftTableSortKey,
  sortDir: DriftTableSortDir,
): InfraEvidenceDiffChange[] {
  const direction = sortDir === "desc" ? -1 : 1;
  const sorted = [...rows];

  sorted.sort((left, right) => {
    let result = 0;

    switch (sortBy) {
      case "resource":
        result = compareStrings(
          formatAzureResourceDisplay(left.azureResourceId).name,
          formatAzureResourceDisplay(right.azureResourceId).name,
        );
        break;

      case "resourceGroup":
        result = compareStrings(
          formatAzureResourceDisplay(left.azureResourceId).resourceGroup,
          formatAzureResourceDisplay(right.azureResourceId).resourceGroup,
        );
        break;

      case "resourceType":
        result = compareStrings(
          formatAzureResourceDisplay(left.azureResourceId).resourceType,
          formatAzureResourceDisplay(right.azureResourceId).resourceType,
        );
        break;

      case "change":
        result = compareStrings(
          formatInfraEvidenceChangeTypeLabel(left.changeType),
          formatInfraEvidenceChangeTypeLabel(right.changeType),
        );
        break;

      case "property":
        result = compareStrings(left.property, right.property);
        break;

      case "risk":
        result = compareStrings(
          formatInfraEvidenceDriftRiskLabel(resolveInfraEvidenceDriftRiskKey(left.riskClassification)),
          formatInfraEvidenceDriftRiskLabel(resolveInfraEvidenceDriftRiskKey(right.riskClassification)),
        );
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

export function filterDriftChanges(
  rows: readonly InfraEvidenceDiffChange[],
  state: Pick<
    DriftTableFilterState,
    | "riskFilter"
    | "changeTypeFilter"
    | "resourceFilter"
    | "resourceGroupFilter"
    | "resourceTypeFilter"
    | "propertyFilter"
  >,
  selectedDiff: InfraEvidenceDiffSummary | null = null,
): InfraEvidenceDiffChange[] {
  const resourceNeedle = state.resourceFilter.trim().toLowerCase();
  const resourceGroupNeedle = state.resourceGroupFilter.trim().toLowerCase();
  const resourceTypeNeedle = state.resourceTypeFilter.trim().toLowerCase();
  const propertyNeedle = state.propertyFilter.trim().toLowerCase();
  const riskFilter = state.riskFilter.trim().toLowerCase();
  const changeTypeFilter = state.changeTypeFilter.trim();
  const comparingTwoInventories = isComparingTwoInventorySnapshots(selectedDiff);
  const visibleRows = comparingTwoInventories
    ? suppressNestedResourceRemovedChanges(rows)
    : rows;

  return visibleRows.filter((row) => {
    if (isInfraEvidenceResourceRemovedChange(row.changeType) && !comparingTwoInventories) {
      return false;
    }

    if (riskFilter.length > 0) {
      const rowRisk = resolveInfraEvidenceDriftRiskKey(row.riskClassification);

      if (rowRisk !== riskFilter) {
        return false;
      }
    }

    if (changeTypeFilter.length > 0) {
      if (normalizeInfraEvidenceChangeTypeKey(row.changeType) !== changeTypeFilter) {
        return false;
      }
    }

    if (resourceNeedle.length > 0) {
      const haystack = `${row.azureResourceId ?? ""} ${row.cloudResourceId ?? ""}`.toLowerCase();

      if (!haystack.includes(resourceNeedle)) {
        return false;
      }
    }

    if (resourceGroupNeedle.length > 0) {
      const resourceGroup = formatAzureResourceDisplay(row.azureResourceId).resourceGroup?.toLowerCase() ?? "";

      if (!resourceGroup.includes(resourceGroupNeedle)) {
        return false;
      }
    }

    if (resourceTypeNeedle.length > 0) {
      if (!resourceTypeHaystack(row.azureResourceId).includes(resourceTypeNeedle)) {
        return false;
      }
    }

    if (propertyNeedle.length > 0) {
      const property = row.property?.trim().toLowerCase() ?? "";

      if (!property.includes(propertyNeedle)) {
        return false;
      }
    }

    return true;
  });
}

export function toggleDriftTableSort(
  current: DriftTableFilterState,
  nextSortBy: DriftTableSortKey,
): DriftTableFilterState {
  if (current.sortBy === nextSortBy) {
    return {
      ...current,
      sortDir: current.sortDir === "asc" ? "desc" : "asc",
      changesPage: 1,
    };
  }

  return {
    ...current,
    sortBy: nextSortBy,
    sortDir: "asc",
    changesPage: 1,
  };
}
