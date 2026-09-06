import { GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import type { DiagramInfrastructureCorrespondenceRow } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";
import type { DiagramReconcileMatchKindFilter } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";
import { buildRemediationWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-workbench-url";

export const DIAGRAM_RECONCILE_RUN_ID_PARAM = "runId";
export const DIAGRAM_RECONCILE_SNAPSHOT_ID_PARAM = "snapshotId";
export const DIAGRAM_RECONCILE_CLOUD_RESOURCE_ID_PARAM = "cloudResourceId";
export const DIAGRAM_RECONCILE_FILTER_PARAM = "reconcileFilter";
export const DIAGRAM_RECONCILE_CORRESPONDENCE_ID_PARAM = "correspondenceId";

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

export function parseDiagramReconcileCloudResourceIdFromSearch(raw: string | null | undefined): string {
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

export function parseDiagramReconcileCorrespondenceIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function buildDiagramReconcileWorkbenchHref(context: {
  readonly runId?: string | null;
  readonly snapshotId?: string | null;
  readonly cloudResourceId?: string | null;
  readonly reconcileFilter?: DiagramReconcileMatchKindFilter;
  readonly correspondenceId?: string | null;
}): string {
  const params = new URLSearchParams();

  if (context.runId != null && context.runId.trim().length > 0) {
    params.set(DIAGRAM_RECONCILE_RUN_ID_PARAM, context.runId.trim());
  }

  if (context.snapshotId != null && context.snapshotId.trim().length > 0) {
    params.set(DIAGRAM_RECONCILE_SNAPSHOT_ID_PARAM, context.snapshotId.trim());
  }

  if (context.cloudResourceId != null && context.cloudResourceId.trim().length > 0) {
    params.set(DIAGRAM_RECONCILE_CLOUD_RESOURCE_ID_PARAM, context.cloudResourceId.trim());
  }

  if (context.reconcileFilter != null && context.reconcileFilter !== "all") {
    params.set(DIAGRAM_RECONCILE_FILTER_PARAM, context.reconcileFilter);
  }

  if (context.correspondenceId != null && context.correspondenceId.trim().length > 0) {
    params.set(DIAGRAM_RECONCILE_CORRESPONDENCE_ID_PARAM, context.correspondenceId.trim());
  }

  const query = params.toString();

  return query.length === 0
    ? GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH
    : `${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH}?${query}`;
}

export function buildDiagramReconcileRemediationHref(context: {
  readonly row: DiagramInfrastructureCorrespondenceRow;
  readonly runId: string;
  readonly snapshotId: string;
  readonly scopedCloudResourceId?: string | null;
  readonly findingId?: string | null;
}): string | null {
  if (context.row.matchKind !== "Conflict") {
    return null;
  }

  const rowCloudResourceId = context.row.cloudResourceId != null && context.row.cloudResourceId.trim().length > 0
    ? context.row.cloudResourceId
    : null;
  const cloudResourceId = rowCloudResourceId ?? (
    context.scopedCloudResourceId != null && context.scopedCloudResourceId.trim().length > 0
      ? context.scopedCloudResourceId
      : null
  );

  return buildRemediationWorkbenchHref({
    cloudResourceId,
    correspondenceId: context.row.correspondenceId,
    findingId: context.findingId,
    runId: context.runId.length > 0 ? context.runId : null,
    snapshotId: context.snapshotId.length > 0 ? context.snapshotId : null,
  });
}

export function diagramReconcileFilterHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly runId?: string;
    readonly snapshotId?: string;
    readonly cloudResourceId?: string;
    readonly reconcileFilter?: DiagramReconcileMatchKindFilter;
    readonly correspondenceId?: string;
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

  if (patch.cloudResourceId !== undefined) {
    const trimmed = patch.cloudResourceId.trim();

    if (trimmed.length === 0) {
      params.delete(DIAGRAM_RECONCILE_CLOUD_RESOURCE_ID_PARAM);
    } else {
      params.set(DIAGRAM_RECONCILE_CLOUD_RESOURCE_ID_PARAM, trimmed);
    }
  }

  if (patch.reconcileFilter !== undefined) {
    if (patch.reconcileFilter === "all") {
      params.delete(DIAGRAM_RECONCILE_FILTER_PARAM);
    } else {
      params.set(DIAGRAM_RECONCILE_FILTER_PARAM, patch.reconcileFilter);
    }
  }

  if (patch.correspondenceId !== undefined) {
    const trimmed = patch.correspondenceId.trim();

    if (trimmed.length === 0) {
      params.delete(DIAGRAM_RECONCILE_CORRESPONDENCE_ID_PARAM);
    } else {
      params.set(DIAGRAM_RECONCILE_CORRESPONDENCE_ID_PARAM, trimmed);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
