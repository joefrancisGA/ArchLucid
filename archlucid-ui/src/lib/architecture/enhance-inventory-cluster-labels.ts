const CLUSTER_LABEL_ABOVE_GAP_PX = 8;
const CLUSTER_LABEL_INSET_PX = 10;
const CLUSTER_LABEL_FONT_SIZE_PX = 14;
const CLUSTER_LABEL_FONT_WEIGHT = "700";

function readFiniteAttribute(element: Element, name: string, fallback: number): number {
  const parsed = Number.parseFloat(element.getAttribute(name) ?? "");

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function isPackingCluster(cluster: Element): boolean {
  const clusterId = (cluster.getAttribute("id") ?? "").toLowerCase();

  return clusterId.includes("alpack");
}

function readClusterRect(cluster: Element): Element | null {
  return cluster.querySelector(":scope > rect, :scope > .cluster_rect");
}

function boldResourceGroupLabelText(text: Element, labelX: number, labelY: number): void {
  text.setAttribute("class", "clusterLabelText");
  text.setAttribute("text-anchor", "start");
  text.setAttribute("dominant-baseline", "auto");
  text.setAttribute("font-weight", CLUSTER_LABEL_FONT_WEIGHT);
  text.setAttribute("font-size", String(CLUSTER_LABEL_FONT_SIZE_PX));
  text.setAttribute("x", String(labelX));
  text.setAttribute("y", String(labelY));

  const tspans = [...text.querySelectorAll("tspan")];

  for (let index = 0; index < tspans.length; index += 1) {
    const tspan = tspans[index];

    if (tspan === undefined) {
      continue;
    }

    tspan.setAttribute("x", String(labelX));

    if (index === 0) {
      tspan.setAttribute("dy", "0");
    }
  }
}

/** Bold resource-group captions on Mermaid clusters and inventory-forest rg-frame labels. */
export function enhanceInventoryClusterLabels(svg: Element): void {
  const forestFrames = svg.querySelectorAll("g.rg-frame");

  for (const frame of forestFrames) {
    const text = frame.querySelector(":scope > text");

    if (text === null) {
      continue;
    }

    const labelX = readFiniteAttribute(text, "x", 0);
    const labelY = readFiniteAttribute(text, "y", 0);

    boldResourceGroupLabelText(text, labelX, labelY);
  }

  const clusters = svg.querySelectorAll("g.cluster");

  for (const cluster of clusters) {
    if (isPackingCluster(cluster)) {
      continue;
    }

    const rect = readClusterRect(cluster);
    const labelGroup = cluster.querySelector(":scope > g.cluster-label");

    if (rect === null || labelGroup === null) {
      continue;
    }

    const text = labelGroup.querySelector("text");

    if (text === null) {
      continue;
    }

    const rectX = readFiniteAttribute(rect, "x", 0);
    const rectY = readFiniteAttribute(rect, "y", 0);
    const labelX = rectX + CLUSTER_LABEL_INSET_PX;
    const labelY = rectY - CLUSTER_LABEL_ABOVE_GAP_PX;

    labelGroup.removeAttribute("transform");
    boldResourceGroupLabelText(text, labelX, labelY);
  }
}
