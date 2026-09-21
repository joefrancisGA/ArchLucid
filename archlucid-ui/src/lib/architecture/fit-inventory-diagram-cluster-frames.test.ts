import { describe, expect, it } from "vitest";

import {
  CLUSTER_FRAME_PAD_PX,
  fitInventoryDiagramClusterFrames,
} from "@/lib/architecture/fit-inventory-diagram-cluster-frames";

const SVG_NS = "http://www.w3.org/2000/svg";

function identityMatrix(): DOMMatrix {
  return {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
    inverse: () => identityMatrix(),
    multiply: () => identityMatrix(),
  } as DOMMatrix;
}

function stubGraphicsBox(element: SVGGraphicsElement, box: DOMRect): void {
  element.getScreenCTM = () => identityMatrix();
  element.getBBox = () => box;
}

function mountSvg(svg: SVGSVGElement): void {
  if (typeof svg.createSVGPoint !== "function") {
    svg.createSVGPoint = (): DOMPoint =>
      ({
        x: 0,
        y: 0,
        z: 0,
        w: 1,
        matrixTransform(matrix: DOMMatrixInit): DOMPoint {
          const resolved = matrix as DOMMatrix;
          const mappedX = this.x * resolved.a + this.y * resolved.c + resolved.e;
          const mappedY = this.x * resolved.b + this.y * resolved.d + resolved.f;

          return { x: mappedX, y: mappedY, z: 0, w: 1 } as DOMPoint;
        },
      }) as DOMPoint;
  }

  document.body.appendChild(svg);
  stubGraphicsBox(svg, new DOMRect(0, 0, 1000, 1000));
}

describe("fitInventoryDiagramClusterFrames", () => {
  it("expands a cluster rect to contain a wide truncated-label node", () => {
    const svg = document.createElementNS(SVG_NS, "svg");
    const cluster = document.createElementNS(SVG_NS, "g");
    cluster.setAttribute("class", "cluster");
    cluster.setAttribute("id", "rg-only-dr-test");

    const clusterRect = document.createElementNS(SVG_NS, "rect");
    clusterRect.setAttribute("class", "cluster_rect");
    clusterRect.setAttribute("x", "0");
    clusterRect.setAttribute("y", "0");
    clusterRect.setAttribute("width", "120");
    clusterRect.setAttribute("height", "80");

    const node = document.createElementNS(SVG_NS, "g");
    node.setAttribute("class", "node");
    node.setAttribute("transform", "translate(80, 20)");

    const nodeRect = document.createElementNS(SVG_NS, "rect");
    nodeRect.setAttribute("width", "70");
    nodeRect.setAttribute("height", "36");

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "nodeLabel");
    label.textContent = "avd01 pner nonprod persistens...";

    node.appendChild(nodeRect);
    node.appendChild(label);
    cluster.appendChild(clusterRect);
    cluster.appendChild(node);
    svg.appendChild(cluster);
    mountSvg(svg);

    stubGraphicsBox(cluster as SVGGraphicsElement, new DOMRect(0, 0, 120, 80));
    stubGraphicsBox(clusterRect, new DOMRect(0, 0, 120, 80));
    stubGraphicsBox(node, new DOMRect(80, 20, 70, 36));

    fitInventoryDiagramClusterFrames(svg);

    expect(clusterRect.getAttribute("width")).not.toBe("120");
    expect(Number.parseFloat(clusterRect.getAttribute("width") ?? "0")).toBeGreaterThanOrEqual(70 + CLUSTER_FRAME_PAD_PX * 2);
    expect(Number.parseFloat(clusterRect.getAttribute("x") ?? "0")).toBeLessThanOrEqual(80 - CLUSTER_FRAME_PAD_PX);
    expect(nodeRect.getAttribute("width")).toBe("70");

    svg.remove();
  });

  it("probe: overflow fixture fails containment before the rewrite", () => {
    const clusterRightBefore = 120;
    const nodeRight = 80 + 70;

    expect(clusterRightBefore).toBeLessThan(nodeRight);

    const svg = document.createElementNS(SVG_NS, "svg");
    const cluster = document.createElementNS(SVG_NS, "g");
    cluster.setAttribute("class", "cluster");
    const clusterRect = document.createElementNS(SVG_NS, "rect");
    clusterRect.setAttribute("width", "120");
    clusterRect.setAttribute("height", "80");

    const node = document.createElementNS(SVG_NS, "g");
    node.setAttribute("class", "node");
    const nodeRect = document.createElementNS(SVG_NS, "rect");
    nodeRect.setAttribute("width", "70");
    nodeRect.setAttribute("height", "36");

    node.appendChild(nodeRect);
    cluster.appendChild(clusterRect);
    cluster.appendChild(node);
    svg.appendChild(cluster);
    mountSvg(svg);

    stubGraphicsBox(cluster as SVGGraphicsElement, new DOMRect(0, 0, 120, 80));
    stubGraphicsBox(clusterRect, new DOMRect(0, 0, 120, 80));
    stubGraphicsBox(node, new DOMRect(80, 20, 70, 36));

    fitInventoryDiagramClusterFrames(svg);

    const clusterRightAfter = Number.parseFloat(clusterRect.getAttribute("x") ?? "0")
      + Number.parseFloat(clusterRect.getAttribute("width") ?? "0");
    expect(clusterRightAfter).toBeGreaterThanOrEqual(nodeRight + CLUSTER_FRAME_PAD_PX);

    svg.remove();
  });

  it("fits nested clusters inside-out and keeps the outer frame around both", () => {
    const svg = document.createElementNS(SVG_NS, "svg");

    const outer = document.createElementNS(SVG_NS, "g");
    outer.setAttribute("class", "cluster");
    outer.setAttribute("id", "outer");

    const outerRect = document.createElementNS(SVG_NS, "rect");
    outerRect.setAttribute("x", "0");
    outerRect.setAttribute("y", "0");
    outerRect.setAttribute("width", "80");
    outerRect.setAttribute("height", "80");

    const inner = document.createElementNS(SVG_NS, "g");
    inner.setAttribute("class", "cluster");
    inner.setAttribute("id", "inner");

    const innerRect = document.createElementNS(SVG_NS, "rect");
    innerRect.setAttribute("x", "10");
    innerRect.setAttribute("y", "10");
    innerRect.setAttribute("width", "40");
    innerRect.setAttribute("height", "40");

    const innerNode = document.createElementNS(SVG_NS, "g");
    innerNode.setAttribute("class", "node");
    const innerNodeRect = document.createElementNS(SVG_NS, "rect");
    innerNodeRect.setAttribute("width", "30");
    innerNodeRect.setAttribute("height", "20");
    innerNode.appendChild(innerNodeRect);

    const outerNode = document.createElementNS(SVG_NS, "g");
    outerNode.setAttribute("class", "node");
    const outerNodeRect = document.createElementNS(SVG_NS, "rect");
    outerNodeRect.setAttribute("width", "30");
    outerNodeRect.setAttribute("height", "20");
    outerNode.appendChild(outerNodeRect);

    inner.appendChild(innerRect);
    inner.appendChild(innerNode);
    outer.appendChild(outerRect);
    outer.appendChild(inner);
    outer.appendChild(outerNode);
    svg.appendChild(outer);
    mountSvg(svg);

    stubGraphicsBox(outer as SVGGraphicsElement, new DOMRect(0, 0, 80, 80));
    stubGraphicsBox(inner as SVGGraphicsElement, new DOMRect(10, 10, 40, 40));
    stubGraphicsBox(outerRect, new DOMRect(0, 0, 80, 80));
    stubGraphicsBox(innerRect, new DOMRect(10, 10, 40, 40));
    stubGraphicsBox(innerNode, new DOMRect(15, 15, 30, 20));
    stubGraphicsBox(outerNode, new DOMRect(100, 100, 30, 20));

    fitInventoryDiagramClusterFrames(svg);

    expect(Number.parseFloat(innerRect.getAttribute("width") ?? "0")).toBeGreaterThanOrEqual(30 + CLUSTER_FRAME_PAD_PX * 2);

    const outerRight = Number.parseFloat(outerRect.getAttribute("x") ?? "0")
      + Number.parseFloat(outerRect.getAttribute("width") ?? "0");
    expect(outerRight).toBeGreaterThanOrEqual(100 + 30 + CLUSTER_FRAME_PAD_PX);

    svg.remove();
  });

  it("no-ops forest SVG that has nodes but no clusters", () => {
    const svg = document.createElementNS(SVG_NS, "svg");
    const node = document.createElementNS(SVG_NS, "g");
    node.setAttribute("class", "node");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", "80");
    rect.setAttribute("height", "32");
    node.appendChild(rect);
    svg.appendChild(node);
    mountSvg(svg);
    stubGraphicsBox(node, new DOMRect(10, 10, 80, 32));

    const before = new XMLSerializer().serializeToString(svg);
    fitInventoryDiagramClusterFrames(svg);
    const after = new XMLSerializer().serializeToString(svg);

    expect(after).toBe(before);

    svg.remove();
  });

  it("rewrites graphviz cluster polygons", () => {
    const svg = document.createElementNS(SVG_NS, "svg");
    const cluster = document.createElementNS(SVG_NS, "g");
    cluster.setAttribute("id", "cluster_rg");
    cluster.setAttribute("class", "cluster");

    const polygon = document.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("points", "0,0 120,0 120,80 0,80");

    const node = document.createElementNS(SVG_NS, "g");
    node.setAttribute("class", "node");
    const nodeRect = document.createElementNS(SVG_NS, "rect");
    nodeRect.setAttribute("width", "70");
    nodeRect.setAttribute("height", "36");
    node.appendChild(nodeRect);

    cluster.appendChild(polygon);
    cluster.appendChild(node);
    svg.appendChild(cluster);
    mountSvg(svg);

    stubGraphicsBox(cluster as SVGGraphicsElement, new DOMRect(0, 0, 120, 80));
    stubGraphicsBox(polygon, new DOMRect(0, 0, 120, 80));
    stubGraphicsBox(node, new DOMRect(80, 20, 70, 36));

    fitInventoryDiagramClusterFrames(svg);

    const points = polygon.getAttribute("points") ?? "";
    const xs = points
      .split(/\s+/u)
      .map((pair) => Number.parseFloat(pair.split(",")[0] ?? "0"));
    const maxX = Math.max(...xs);

    expect(maxX).toBeGreaterThanOrEqual(80 + 70 + CLUSTER_FRAME_PAD_PX);

    svg.remove();
  });
});
