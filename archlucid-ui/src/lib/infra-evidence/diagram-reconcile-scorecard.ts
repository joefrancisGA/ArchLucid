import {
  DIAGRAM_INFRASTRUCTURE_MATCH_KINDS,
  type DiagramInfrastructureCorrespondenceRow,
  type DiagramInfrastructureReconciliationResult,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

export type DiagramReconcileScorecard = {
  readonly matched: number;
  readonly possible: number;
  readonly diagramOnly: number;
  readonly inventoryOnly: number;
  readonly conflicts: number;
  readonly connectorGaps: number | null;
};

export const DIAGRAM_RECONCILE_CONNECTOR_GAPS_NOT_STORED_COPY =
  "Connector gaps were not stored." as const;

export function formatDiagramReconcileConnectorGapsLabel(connectorGaps: number | null): string {
  if (connectorGaps === null) {
    return DIAGRAM_RECONCILE_CONNECTOR_GAPS_NOT_STORED_COPY;
  }

  return `Connector gaps: ${connectorGaps}`;
}

export const DIAGRAM_RECONCILE_RESOURCE_GROUP_NOT_STORED_COPY =
  "Resource group was not stored." as const;

export const DIAGRAM_RECONCILE_RESOURCE_TYPE_NOT_STORED_COPY =
  "Resource type was not stored." as const;

export const DIAGRAM_RECONCILE_RESOURCE_GROUP_STORED_EMPTY_COPY =
  "Resource group was stored empty." as const;

export const DIAGRAM_RECONCILE_DIAGRAM_LABEL_NOT_STORED_COPY =
  "Diagram label was not stored." as const;

export const DIAGRAM_RECONCILE_DIAGRAM_LABEL_STORED_EMPTY_COPY =
  "Diagram label was stored empty." as const;

export const DIAGRAM_RECONCILE_RESOURCE_NAME_NOT_STORED_COPY =
  "Resource name was not stored." as const;

export function formatDiagramReconcileDiagramCellLabel(
  diagramNodeLabel: string | null | undefined,
): string {
  if (diagramNodeLabel === null || diagramNodeLabel === undefined) {
    return DIAGRAM_RECONCILE_DIAGRAM_LABEL_NOT_STORED_COPY;
  }

  if (diagramNodeLabel.trim().length === 0) {
    return DIAGRAM_RECONCILE_DIAGRAM_LABEL_STORED_EMPTY_COPY;
  }

  return diagramNodeLabel;
}

export function formatDiagramReconcileResourceGroupForExport(
  resourceGroup: string | null | undefined,
): string {
  if (resourceGroup === null || resourceGroup === undefined) {
    return DIAGRAM_RECONCILE_RESOURCE_GROUP_NOT_STORED_COPY;
  }

  if (resourceGroup.length === 0) {
    return DIAGRAM_RECONCILE_RESOURCE_GROUP_STORED_EMPTY_COPY;
  }

  return resourceGroup;
}

export function formatDiagramReconcileResourceGroupDisplay(
  resourceGroup: string | null | undefined,
): string {
  if (resourceGroup === null || resourceGroup === undefined) {
    return DIAGRAM_RECONCILE_RESOURCE_GROUP_NOT_STORED_COPY;
  }

  return resourceGroup;
}

export function formatDiagramReconcileResourceTypeDisplay(
  resourceType: string | null | undefined,
): string {
  if (resourceType === null || resourceType === undefined) {
    return DIAGRAM_RECONCILE_RESOURCE_TYPE_NOT_STORED_COPY;
  }

  return resourceType;
}

function diagramReconcileInventoryGroupKey(
  resourceGroup: string | null | undefined,
  resourceType: string | null | undefined,
): string {
  const groupKey = resourceGroup === null || resourceGroup === undefined ? "\u0000missing-rg" : resourceGroup;
  const typeKey = resourceType === null || resourceType === undefined ? "\u0000missing-type" : resourceType;

  return `${groupKey}\u0000${typeKey}`;
}

export type DiagramReconcileInventoryGroup = {
  readonly correspondenceId: string;
  readonly resourceGroup: string;
  readonly resourceType: string;
  readonly count: number;
  readonly resourceNames: readonly string[];
  readonly resourceRows: readonly DiagramInfrastructureCorrespondenceRow[];
};

export function buildDiagramReconcileScorecard(
  reconciliation: DiagramInfrastructureReconciliationResult,
): DiagramReconcileScorecard {
  const rows = reconciliation.rows ?? [];

  return {
    matched: rows.filter((row) =>
      row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.exact
      || row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.probable
      || row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.confirmed).length,
    possible: rows.filter((row) => row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.possible).length,
    diagramOnly: rows.filter((row) => row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.diagramOnly).length,
    inventoryOnly: rows.filter((row) => row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.infrastructureOnly).length,
    conflicts: rows.filter((row) => row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.conflict).length,
    connectorGaps: Array.isArray(reconciliation.edgeGaps) ? reconciliation.edgeGaps.length : null,
  };
}

export function groupDiagramReconcileInventoryOnlyRows(
  rows: readonly DiagramInfrastructureCorrespondenceRow[],
): readonly DiagramReconcileInventoryGroup[] {
  const groups = new Map<string, {
    resourceGroup: string;
    resourceType: string;
    resourceNames: string[];
    resourceRows: DiagramInfrastructureCorrespondenceRow[];
  }>();

  rows
    .filter((row) => row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.infrastructureOnly)
    .forEach((row) => {
      const resourceGroup = formatDiagramReconcileResourceGroupForExport(row.resourceGroup);
      const resourceType = formatDiagramReconcileResourceTypeDisplay(row.resourceType);
      const key = diagramReconcileInventoryGroupKey(row.resourceGroup, row.resourceType);
      const group = groups.get(key) ?? { resourceGroup, resourceType, resourceNames: [], resourceRows: [] };
      group.resourceNames.push(displayInventoryResourceName(row));
      group.resourceRows.push(row);
      groups.set(key, group);
    });

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, group]) => ({
      correspondenceId: `inventory-group-${key}`,
      resourceGroup: group.resourceGroup,
      resourceType: group.resourceType,
      count: group.resourceNames.length,
      resourceNames: [...group.resourceNames].sort((left, right) => left.localeCompare(right)),
      resourceRows: [...group.resourceRows],
    }));
}

export function displayInventoryResourceName(row: DiagramInfrastructureCorrespondenceRow): string {
  const azureResourceId = row.azureResourceId?.trim();

  if (azureResourceId == null || azureResourceId.length === 0) {
    return DIAGRAM_RECONCILE_RESOURCE_NAME_NOT_STORED_COPY;
  }

  if (!azureResourceId.includes("/") && /^[0-9a-f-]{36}$/i.test(azureResourceId)) {
    return DIAGRAM_RECONCILE_RESOURCE_NAME_NOT_STORED_COPY;
  }

  return azureResourceId.split("/").filter(Boolean).at(-1) ?? azureResourceId;
}

export function buildDiagramReconcileDenominatorSentence(inventoryResourceCount: number): string {
  return `Inventory denominator: ${inventoryResourceCount} resources in the visible capture after the never-show list. Dashboards, Log Analytics workspaces, DNS zones, and peering child records are outside this denominator.`;
}

function csvCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll("\"", "\"\"")}"`;
}

export function buildDiagramReconcileCsv(
  reconciliation: DiagramInfrastructureReconciliationResult,
): string {
  const scorecard = buildDiagramReconcileScorecard(reconciliation);
  const groups = groupDiagramReconcileInventoryOnlyRows(reconciliation.rows ?? []);
  const lines: string[] = [
    ["Kind", "Match", "Diagram", "Resource group", "Resource type", "Count", "Resource names", "Explanation"].map(csvCell).join(","),
    ["scorecard", "Matched", "", "", "", scorecard.matched, "", ""].map(csvCell).join(","),
    ["scorecard", "Possible", "", "", "", scorecard.possible, "", ""].map(csvCell).join(","),
    ["scorecard", "Diagram only", "", "", "", scorecard.diagramOnly, "", ""].map(csvCell).join(","),
    ["scorecard", "Inventory only", "", "", "", scorecard.inventoryOnly, "", ""].map(csvCell).join(","),
    ["scorecard", "Conflicts", "", "", "", scorecard.conflicts, "", ""].map(csvCell).join(","),
    [
      "scorecard",
      "Connector gaps",
      "",
      "",
      "",
      scorecard.connectorGaps === null ? DIAGRAM_RECONCILE_CONNECTOR_GAPS_NOT_STORED_COPY : scorecard.connectorGaps,
      "",
      "",
    ].map(csvCell).join(","),
  ];

  groups.forEach((group) => {
    lines.push([
      "inventory-group",
      "Inventory only",
      "",
      group.resourceGroup,
      group.resourceType,
      group.count,
      group.resourceNames.join("; "),
      "",
    ].map(csvCell).join(","));
  });

  reconciliation.rows
    .filter((row) => row.matchKind !== DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.infrastructureOnly)
    .forEach((row) => {
      lines.push([
        "correspondence",
        row.matchKind,
        formatDiagramReconcileDiagramCellLabel(row.diagramNodeLabel),
        formatDiagramReconcileResourceGroupForExport(row.resourceGroup),
        row.resourceType === null || row.resourceType === undefined
          ? DIAGRAM_RECONCILE_RESOURCE_TYPE_NOT_STORED_COPY
          : row.resourceType.length === 0
            ? ""
            : row.resourceType,
        1,
        displayInventoryResourceName(row),
        row.explainText,
      ].map(csvCell).join(","));
    });

  (reconciliation.edgeGaps ?? []).forEach((gap) => {
    const fromCloudResourceId = gap.fromCloudResourceId?.trim() || "Endpoint was not stored";
    const toCloudResourceId = gap.toCloudResourceId?.trim() || "Endpoint was not stored";

    lines.push([
      "connector-gap",
      gap.gapKind,
      `${fromCloudResourceId} → ${toCloudResourceId}`,
      "",
      gap.associationType,
      1,
      gap.diagramEdgeId,
      gap.explainText,
    ].map(csvCell).join(","));
  });

  return `${lines.join("\r\n")}\r\n`;
}
