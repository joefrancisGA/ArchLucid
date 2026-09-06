import { GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import type { DiagramReconcileMatchKindFilter } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

export const DIAGRAM_RECONCILE_RUN_ID_PARAM = "runId";
export const DIAGRAM_RECONCILE_SNAPSHOT_ID_PARAM = "snapshotId";
export const DIAGRAM_RECONCILE_FILTER_PARAM = "reconcileFilter";

const ALLOWED_FILTERS: ReadonlySet<DiagramReconcileMatchKindFilter> = new Set([
  "all",
  "Conflict",
  "DiagramOnly",
  "InfrastructureOnly",
  "Exact",
  "Probable",
]);

export function parseDiagramReconcileRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseDiagramReconcileSnapshotIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseDiagramReconcileFilterFromSearch(raw: string | null | undefined): DiagramReconcileMatchKindFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim() as DiagramReconcileMatchKindFilter;

  if (ALLOWED_FILTERS.has(trimmed)) {
    return trimmed;
  }

  return "all";
}

export function diagramReconcileFilterHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly runId?: string;
    readonly snapshotId?: string;
    readonly reconcileFilter?: DiagramReconcileMatchKindFilter;
  },
  pathname: string = GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.runId !== undefined) {
    const trimmed = patch.runId.trim();

    if (trimmed.length === 0) {
      params.delete(DIAGRAM_RECONCILE_RUN_ID_PARAM);
    } else {
      params.set(DIAGRAM_RECONCILE_RUN_ID_PARAM, trimmed);
    }
  }

  if (patch.snapshotId !== undefined) {
    const trimmed = patch.snapshotId.trim();

    if (trimmed.length === 0) {
      params.delete(DIAGRAM_RECONCILE_SNAPSHOT_ID_PARAM);
    } else {
      params.set(DIAGRAM_RECONCILE_SNAPSHOT_ID_PARAM, trimmed);
    }
  }

  if (patch.reconcileFilter !== undefined) {
    if (patch.reconcileFilter === "all") {
      params.delete(DIAGRAM_RECONCILE_FILTER_PARAM);
    } else {
      params.set(DIAGRAM_RECONCILE_FILTER_PARAM, patch.reconcileFilter);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
