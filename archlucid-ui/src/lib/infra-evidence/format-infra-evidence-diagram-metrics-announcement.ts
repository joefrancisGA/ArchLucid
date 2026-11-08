export type InfraEvidenceDiagramMetricsAnnouncementInput = {
  readonly nodeCount?: number | null;
  readonly edgeCount?: number | null;
  readonly subgraphCount?: number | null;
};

function finiteMetricLabel(
  value: number | null | undefined,
  notStoredLabel: string,
  singular: string,
  plural: string,
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return notStoredLabel;
  }

  return `${value} ${value === 1 ? singular : plural}`;
}

/** Live region copy when render metrics are partially omitted on an otherwise successful render. */
export function formatInfraEvidenceDiagramMetricsAnnouncement(
  metrics: InfraEvidenceDiagramMetricsAnnouncementInput,
): string {
  const nodeLabel = finiteMetricLabel(metrics.nodeCount, "Node count was not stored.", "node", "nodes");
  const edgeLabel = finiteMetricLabel(metrics.edgeCount, "Edge count was not stored.", "edge", "edges");
  const subgraphLabel = finiteMetricLabel(
    metrics.subgraphCount,
    "Subgraph count was not stored.",
    "subgraph",
    "subgraphs",
  );

  const nodeStored = typeof metrics.nodeCount === "number" && Number.isFinite(metrics.nodeCount);
  const edgeStored = typeof metrics.edgeCount === "number" && Number.isFinite(metrics.edgeCount);
  const subgraphStored =
    typeof metrics.subgraphCount === "number" && Number.isFinite(metrics.subgraphCount);

  if (!nodeStored || !edgeStored || !subgraphStored) {
    return [nodeLabel, edgeLabel, subgraphLabel].join(" ");
  }

  return `${metrics.nodeCount} nodes and ${metrics.edgeCount} edges across ${metrics.subgraphCount} subgraphs.`;
}

export function isInfraEvidenceDiagramEdgeCountStored(
  metrics: { readonly edgeCount?: number | null } | null | undefined,
): boolean {
  return metrics != null && typeof metrics.edgeCount === "number" && Number.isFinite(metrics.edgeCount);
}
