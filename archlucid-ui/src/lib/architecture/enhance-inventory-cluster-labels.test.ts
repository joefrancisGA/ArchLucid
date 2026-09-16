import { describe, expect, it } from "vitest";

import { enhanceInventoryClusterLabels } from "@/lib/architecture/enhance-inventory-cluster-labels";

const CLUSTER_WITH_BOTTOM_LABEL = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">',
  '  <g class="cluster" id="rg-anly-edw">',
  '    <rect class="cluster_rect" x="20" y="60" width="200" height="100"/>',
  '    <g class="cluster-label" transform="translate(30, 150)">',
  '      <text class="nodeLabel" x="0" y="0" text-anchor="middle">RG anly-edw-ppd-hi</text>',
  "    </g>",
  "  </g>",
  "</svg>",
].join("");

describe("enhanceInventoryClusterLabels", () => {
  it("bolds resource group captions and moves them above the cluster frame", () => {
    const parsed = new DOMParser().parseFromString(CLUSTER_WITH_BOTTOM_LABEL, "image/svg+xml");
    const svg = parsed.documentElement;

    enhanceInventoryClusterLabels(svg);

    const text = svg.querySelector("g.cluster-label text.clusterLabelText");

    expect(text).not.toBeNull();
    expect(text?.getAttribute("font-weight")).toBe("700");
    expect(text?.getAttribute("text-anchor")).toBe("start");
    expect(Number.parseFloat(text?.getAttribute("y") ?? "0")).toBeLessThan(60);
    expect(Number.parseFloat(text?.getAttribute("x") ?? "0")).toBeGreaterThanOrEqual(20);
    expect(svg.querySelector("g.cluster-label")?.getAttribute("transform")).toBeNull();
  });

  it("skips transparent packing clusters", () => {
    const parsed = new DOMParser().parseFromString(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">',
        '  <g class="cluster" id="alpack_1">',
        '    <rect x="0" y="0" width="80" height="40"/>',
        '    <g class="cluster-label"><text class="nodeLabel">pair</text></g>',
        "  </g>",
        "</svg>",
      ].join(""),
      "image/svg+xml",
    );

    enhanceInventoryClusterLabels(parsed.documentElement);

    expect(parsed.querySelector("text.clusterLabelText")).toBeNull();
  });
});
