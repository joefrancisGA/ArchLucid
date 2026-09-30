import { describe, expect, it, vi } from "vitest";

import {
  applyDiagramOverviewCaptions,
  formatOverviewCaption,
  isDiagramOverviewHierarchyScale,
  isDiagramOverviewScale,
  readDiagramPaintedScale,
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

  it("uses an inclusive 30 percent hierarchy threshold", () => {
    expect(isDiagramOverviewHierarchyScale(0.3)).toBe(true);
    expect(isDiagramOverviewHierarchyScale(0.3001)).toBe(false);
  });

  it("formats and truncates captions", () => {
    expect(formatOverviewCaption("vnet-hub-prod", 14)).toBe("vnet-hub-prod · 14");
    expect(truncateOverviewName("123456789012345678901234567890123")).toBe(
      "12345678901234567890123456789012…",
    );
  });

  it("counts node centers inside a VNet frame", () => {
    const svg = createSvg(`
      <g class="vnet-frame"><title>alpha</title><rect x="10" y="10" width="400" height="80"/></g>
      <g class="node" transform="translate(20 20)"><rect class="node-card" width="10" height="10"/></g>
      <g class="node" transform="translate(70 70)"><rect class="node-card" width="10" height="10"/></g>
      <g class="node" transform="translate(100 100)"><rect class="node-card" width="10" height="10"/></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);

    expect(svg.querySelector("text.overview-caption")?.textContent).toBe("alpha · 2");
  });

  it("adds and removes the overview layer and hidden classes", () => {
    const svg = createSvg(`
      <g class="rg-frame"><title>alpha</title><rect class="rg-frame-plate" x="0" y="0" width="400" height="100"/></g>
      <g class="node" transform="translate(10 10)"><rect class="node-card" width="10" height="10"/><text>card</text></g>
      <g class="edge"><text class="edge-label">used by</text></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);
    expect(svg.querySelector("text.overview-caption")?.textContent).toBe("alpha · 1");
    expect(svg.querySelector("g.node text")).toHaveClass("diagram-overview-hidden");
    expect(svg.querySelector("g.edge text.edge-label")).not.toHaveClass("diagram-overview-hidden");

    applyDiagramOverviewCaptions(svg, 0.5);
    expect(svg.querySelector("g.overview-captions")).toBeNull();
    expect(svg.querySelector("g.node text")).not.toHaveClass("diagram-overview-hidden");
  });

  it("leaves thin frames and their labels intact", () => {
    const svg = createSvg(`
      <g class="vnet-frame"><title>thin</title><rect x="0" y="0" width="100" height="42"/></g>
      <g class="node" transform="translate(10 10)"><rect class="node-card" width="10" height="10"/><text>card</text></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);

    expect(svg.querySelector("g.overview-captions")).toBeNull();
    expect(svg.querySelector("g.node text")).not.toHaveClass("diagram-overview-hidden");
  });

  it("clips a qualifying caption to its frame", () => {
    const svg = createSvg(`
      <g class="vnet-frame"><title>alpha</title><rect x="0" y="0" width="800" height="50"/></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);

    expect(svg.querySelector("text.overview-caption")).toHaveAttribute("clip-path", "url(#diagram-overview-clip-0)");
    expect(svg.querySelector("clipPath rect")).toHaveAttribute("height", "50");
  });

  it("hides the sanitized resource-group name while the overview caption is on", () => {
    const svg = createSvg(`
      <g class="rg-frame">
        <title>alpha</title>
        <rect class="rg-frame-plate" x="0" y="0" width="400" height="50"/>
        <g class="azure-icon"></g>
        <text class="clusterLabelText">alpha</text>
      </g>
      <g class="node" transform="translate(180 180)"><g class="azure-icon"></g><rect class="node-card" width="10" height="10"/></g>
      <g class="edge"><text class="edge-label">used by</text></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);

    expect(svg.querySelector("text.overview-caption")?.textContent).toBe("alpha · 0");
    expect(svg.querySelector("g.rg-frame > text.clusterLabelText")).toHaveClass("diagram-overview-hidden");
    expect(svg.querySelector("g.rg-frame > g.azure-icon")).toHaveClass("diagram-overview-hidden");
    expect(svg.querySelector("g.node g.azure-icon")).not.toHaveClass("diagram-overview-hidden");
    expect(svg.querySelector("g.edge text.edge-label")).not.toHaveClass("diagram-overview-hidden");

    applyDiagramOverviewCaptions(svg, 0.5);

    expect(svg.querySelector("g.overview-captions")).toBeNull();
    expect(svg.querySelector("g.rg-frame > text.clusterLabelText")).not.toHaveClass("diagram-overview-hidden");
  });

  it("keeps the sanitized name on a frame that is too short for an overview caption", () => {
    const svg = createSvg(`
      <g class="rg-frame">
        <title>thin</title>
        <rect class="rg-frame-plate" x="0" y="0" width="100" height="40"/>
        <text class="clusterLabelText">thin</text>
      </g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);

    expect(svg.querySelector("g.overview-captions")).toBeNull();
    expect(svg.querySelector("text.clusterLabelText")).not.toHaveClass("diagram-overview-hidden");
  });

  it("reads the scale after CSS has painted the SVG", () => {
    const svg = createSvg("");
    svg.setAttribute("viewBox", "0 0 200 100");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      width: 80,
    } as DOMRect);

    expect(readDiagramPaintedScale(svg)).toBe(0.4);
  });

  it("keeps one VNet identity instead of a nested RG identity in hierarchy mode", () => {
    const svg = createSvg(`
      <g class="rg-frame">
        <title>rg-alpha</title>
        <rect class="rg-frame-plate" x="0" y="0" width="600" height="100"/>
        <text class="clusterLabelText">rg-alpha</text>
      </g>
      <g class="vnet-frame">
        <title>vnet-alpha</title>
        <rect x="10" y="10" width="600" height="70"/>
        <g class="vnet-frame-caption"><text>vnet-alpha</text></g>
      </g>
      <g class="node" transform="translate(20 20)">
        <rect class="node-card" width="10" height="10"/><text>card</text>
      </g>
      <g class="edge"><path d="M0 0H10"/><text class="edge-label">used by</text></g>
      <g class="edge-stub"><path d="M0 0H10"/><text>→ peer</text></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.3);

    expect([...svg.querySelectorAll("text.overview-caption")].map((text) => text.textContent)).toEqual([
      "vnet-alpha · 1",
    ]);
    expect(svg.querySelector("g.node text")).toHaveClass("diagram-overview-hidden");
    expect(svg.querySelector("g.edge text")).toHaveClass("diagram-overview-hidden");
    expect(svg.querySelector("g.edge-stub text")).toHaveClass("diagram-overview-hidden");
    expect(svg.querySelector("g.edge path")).not.toHaveClass("diagram-overview-hidden");

    applyDiagramOverviewCaptions(svg, 0.4);

    expect(svg.querySelector("g.edge text")).not.toHaveClass("diagram-overview-hidden");
    expect(svg.querySelectorAll("text.overview-caption")).toHaveLength(1);
  });

  it("seats a VNet beside an RG in the same row through the overview range", () => {
    const svg = createSvg(`
      <g class="rg-frame"><title>resource-group-long-name</title><rect class="rg-frame-plate" x="0" y="0" width="400" height="60"/></g>
      <g class="vnet-frame"><title>vnet-alpha</title><rect x="428" y="0" width="400" height="60"/></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);
    expect([...svg.querySelectorAll("text.overview-caption")].map((text) => text.textContent)).toEqual([
      "vnet-alpha · 0",
    ]);

    const separate = createSvg(`
      <g class="rg-frame"><title>resource-group-long-name</title><rect class="rg-frame-plate" x="0" y="0" width="400" height="60"/></g>
      <g class="vnet-frame"><title>vnet-alpha</title><rect x="429" y="100" width="400" height="60"/></g>
    `);
    applyDiagramOverviewCaptions(separate, 0.4);
    expect(separate.querySelectorAll("text.overview-caption")).toHaveLength(2);
  });

  it("places a full narrow-frame caption to the right of the frame", () => {
    const svg = createSvg(`
      <g class="vnet-frame"><title>vnet-edw-hi-nprd-wus-001</title><rect x="0" y="0" width="200" height="120"/></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.2);

    const text = svg.querySelector("text.overview-caption");
    expect(text?.textContent).toBe("vnet-edw-hi-nprd-wus-001 · 0");
    expect(text?.textContent).not.toContain("…");
    expect(Number(text?.getAttribute("x"))).toBe(200 + 6 / 0.2);
    expect(Number(text?.getAttribute("y"))).toBe(16 / 0.2);
    expect(text).not.toHaveAttribute("clip-path");
    expect(svg.querySelector("rect.overview-caption-halo")).toBe(
      text?.previousElementSibling,
    );
  });

  it("keeps right-side halos clear of stacked frames", () => {
    const svg = createSvg(`
      <g class="vnet-frame"><title>vnet-alpha</title><rect x="0" y="0" width="200" height="120"/></g>
      <g class="rg-frame"><title>resource-group-beta</title><rect class="rg-frame-plate" x="0" y="120" width="200" height="120"/></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.2);

    const frameRects = [...svg.querySelectorAll("rect:not(.overview-caption-halo)")];
    for (const halo of svg.querySelectorAll("rect.overview-caption-halo")) {
      const haloRight = Number(halo.getAttribute("x")) + Number(halo.getAttribute("width"));
      expect(haloRight).toBeGreaterThan(200);
      expect(frameRects.some((frame) => {
        const frameX = Number(frame.getAttribute("x"));
        const frameRight = frameX + Number(frame.getAttribute("width"));
        const frameY = Number(frame.getAttribute("y"));
        const frameBottom = frameY + Number(frame.getAttribute("height"));
        const haloX = Number(halo.getAttribute("x"));
        const haloY = Number(halo.getAttribute("y"));
        return haloX < frameRight
          && haloRight > frameX
          && haloY < frameBottom
          && Number(halo.getAttribute("height")) + haloY > frameY;
      })).toBe(false);
    }
  });

  it("uses above placement when the right side would cover another frame", () => {
    const svg = createSvg(`
      <g class="vnet-frame"><title>vnet-alpha</title><rect x="0" y="200" width="200" height="60"/></g>
      <g class="rg-frame"><title>resource-group-beta</title><rect class="rg-frame-plate" x="210" y="200" width="400" height="60"/></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);

    const text = svg.querySelector("text.overview-caption");
    expect(Number(text?.getAttribute("x"))).toBe(0);
    expect(Number(text?.getAttribute("y"))).toBeLessThan(200);
    expect(text).not.toHaveAttribute("clip-path");
  });

  it("keeps a wide caption inside the frame", () => {
    const svg = createSvg(`
      <g class="vnet-frame"><title>vnet-avd-hi-nprd</title><rect x="0" y="80" width="800" height="60"/></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.4);

    const text = svg.querySelector("text.overview-caption");
    expect(Number(text?.getAttribute("y"))).toBe(80 + 14 / 0.4);
    expect(text).toHaveAttribute("clip-path");
    expect(svg.querySelector("rect.overview-caption-halo")).toBeNull();
  });

  it("keeps the full narrow caption in hierarchy mode", () => {
    const svg = createSvg(`
      <g class="vnet-frame"><title>vnet-avd-hi-nprd</title><rect x="0" y="0" width="200" height="90"/></g>
      <g class="node" transform="translate(20 20)"><rect class="node-card" width="10" height="10"/><text>card</text></g>
    `);

    applyDiagramOverviewCaptions(svg, 0.2);

    expect(svg.querySelector("text.overview-caption")?.textContent).toBe("vnet-avd-hi-nprd · 1");
    expect(svg.querySelector("text.overview-caption")).not.toHaveAttribute("clip-path");
    expect(svg.querySelector("g.node text")).toHaveClass("diagram-overview-hidden");
  });
});
