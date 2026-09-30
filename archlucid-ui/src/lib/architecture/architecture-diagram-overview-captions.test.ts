import { describe, expect, it } from "vitest";

import {
  applyDiagramOverviewCaptions,
  formatOverviewCaption,
  isDiagramOverviewScale,
  truncateOverviewName,
} from "@/lib/architecture/architecture-diagram-overview-captions";

const SVG_NS = "http://www.w3.org/2000/svg";

function createSvg(markup: string): SVGSVGElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `<svg xmlns="${SVG_NS}" viewBox="0 0 200 200">${markup}</svg>`;
  return wrapper.firstElementChild as SVGSVGElement;
}

describe("architecture diagram overview captions", () => {
  it("uses a strict 45 percent threshold", () => {
    expect(isDiagramOverviewScale(0.449)).toBe(true);
    expect(isDiagramOverviewScale(0.45)).toBe(false);
  });

  it("formats and truncates captions", () => {
    expect(formatOverviewCaption("vnet-hub-prod", 14)).toBe("vnet-hub-prod · 14");
    expect(truncateOverviewName("123456789012345678901234567890123")).toBe(
      "12345678901234567890123456789012…",
    );
  });

  it("counts node centers inside a VNet frame", () => {
    const svg = createSvg(`
      <g class="vnet-frame"><title>alpha</title><rect x="10" y="10" width="80" height="80"/></g>
      <g class="node" transform="translate(20 20)"><rect class="node-card" width="10" height="10"/></g>
      <g class="node" transform="translate(70 70)"><rect class="node-card" width="10" height="10"/></g>
      <g class="node" transform="translate(100 100)"><rect class="node-card" width="10" height="10"/></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);

    expect(svg.querySelector("text.overview-caption")?.textContent).toBe("alpha · 2");
  });

  it("adds and removes the overview layer and hidden classes", () => {
    const svg = createSvg(`
      <g class="rg-frame"><title>alpha</title><rect class="rg-frame-plate" x="0" y="0" width="100" height="100"/></g>
      <g class="node" transform="translate(10 10)"><rect class="node-card" width="10" height="10"/><text>card</text></g>
      <g class="edge"><text class="edge-label">used by</text></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);
    expect(svg.querySelector("text.overview-caption")?.textContent).toBe("alpha · 1");
    expect(svg.querySelector("g.node text")).toHaveClass("diagram-overview-hidden");
    expect(svg.querySelector("g.edge text.edge-label")).toHaveClass("diagram-overview-hidden");

    applyDiagramOverviewCaptions(svg, 0.5);
    expect(svg.querySelector("g.overview-captions")).toBeNull();
    expect(svg.querySelector("g.node text")).not.toHaveClass("diagram-overview-hidden");
  });
});
