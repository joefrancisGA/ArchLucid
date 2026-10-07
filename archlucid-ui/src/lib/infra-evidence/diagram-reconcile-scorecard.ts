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
  readonly connectorGaps: number;
};

export type DiagramReconcileInventoryGroup = {
  readonly correspondenceId: string;
  readonly resourceGroup: string;
  readonly resourceType: string;
  readonly count: number;
  readonly resourceNames: readonly string[];
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
    connectorGaps: reconciliation.edgeGaps?.length ?? 0,
  };
}

export function groupDiagramReconcileInventoryOnlyRows(
  rows: readonly DiagramInfrastructureCorrespondenceRow[],
): readonly DiagramReconcileInventoryGroup[] {
  const groups = new Map<string, {
    resourceGroup: string;
    resourceType: string;
    resourceNames: string[];
  }>();

  rows
    .filter((row) => row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.infrastructureOnly)
    .forEach((row) => {
      const resourceGroup = row.resourceGroup?.trim() || "Unassigned resource group";
      const resourceType = row.resourceType?.trim() || "Unknown resource type";
      const key = `${resourceGroup}\u0000${resourceType}`;
      const group = groups.get(key) ?? { resourceGroup, resourceType, resourceNames: [] };
      group.resourceNames.push(displayInventoryResourceName(row));
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
    }));
}

function displayInventoryResourceName(row: DiagramInfrastructureCorrespondenceRow): string {
  const azureResourceId = row.azureResourceId?.trim();

  if (azureResourceId != null && azureResourceId.length > 0) {
    return azureResourceId.split("/").filter(Boolean).at(-1) ?? azureResourceId;
  }

  return row.correspondenceId;
}

export function buildDiagramReconcileDenominatorSentence(inventoryResourceCount: number): string {
  return `Inventory denominator: ${inventoryResourceCount} resources in the visible capture after the never-show list. Dashboards, Log Analytics workspaces, DNS zones, and peering child records are outside this denominator.`;
}

function csvCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

export function buildDiagramReconcileCsv(
  reconciliation: DiagramInfrastructureReconciliationResult,
): string {
  const scorecard = buildDiagramReconcileScorecard(reconciliation);
  const groups = groupDiagramReconcileInventoryOnlyRows(reconciliation.rows ?? []);
  const lines: string[] = [
    ["kind", "match", "diagram", "resource group", "resource type", "count", "resource names", "explanation"].map(csvCell).join(","),
    ["scorecard", "Matched", "", "", "", scorecard.matched, "", ""].map(csvCell).join(","),
    ["scorecard", "Possible", "", "", "", scorecard.possible, "", ""].map(csvCell).join(","),
    ["scorecard", "Diagram only", "", "", "", scorecard.diagramOnly, "", ""].map(csvCell).join(","),
    ["scorecard", "Inventory only", "", "", "", scorecard.inventoryOnly, "", ""].map(csvCell).join(","),
    ["scorecard", "Conflicts", "", "", "", scorecard.conflicts, "", ""].map(csvCell).join(","),
    ["scorecard", "Connector gaps", "", "", "", scorecard.connectorGaps, "", ""].map(csvCell).join(","),
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
        row.diagramNodeLabel ?? row.diagramNodeId ?? row.correspondenceId,
        row.resourceGroup,
        row.resourceType,
        1,
        row.azureResourceId,
        row.explainText,
      ].map(csvCell).join(","));
    });

  (reconciliation.edgeGaps ?? []).forEach((gap) => {
    lines.push([
      "connector-gap",
      gap.gapKind,
      `${gap.fromCloudResourceId ?? "—"} → ${gap.toCloudResourceId ?? "—"}`,
      "",
      gap.associationType,
      1,
      gap.diagramEdgeId,
      gap.explainText,
    ].map(csvCell).join(","));
  });

  return `${lines.join("\r\n")}\r\n`;
}
