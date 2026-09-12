import { describe, expect, it } from "vitest";

import {
  applyMermaidSvgViewportZoom,
  fitMermaidSvgElementToHost,
  fitMermaidSvgElementToViewport,
  isMermaidDiagramSource,
  isMermaidViewportPaintTooSmall,
  MERMAID_VIEWPORT_MAX_HEIGHT_PX,
  MERMAID_VIEWPORT_STABLE_MIN_HEIGHT_PX,
  prepareMermaidSvgForResponsiveLayout,
  readMermaidViewportFitBudget,
  removeMermaidRenderBindElement,
  sanitizeMermaidRenderId,
} from "@/lib/help/help-mermaid";

describe("help-mermaid", () => {
  it("detects explicit mermaid fence languages", () => {
    expect(isMermaidDiagramSource("flowchart LR\n  A --> B", "mermaid")).toBe(true);
    expect(isMermaidDiagramSource("flowchart LR\n  A --> B", "mmd")).toBe(true);
  });

  it("detects common mermaid diagram starters without a language tag", () => {
    expect(isMermaidDiagramSource("flowchart LR\n  A --> B")).toBe(true);
    expect(isMermaidDiagramSource("sequenceDiagram\n  A->>B: hi")).toBe(true);
    expect(isMermaidDiagramSource("graph TD\n  A --> B")).toBe(true);
  });

  it("does not treat ordinary code fences as mermaid", () => {
    expect(isMermaidDiagramSource('console.log("hello")', "javascript")).toBe(false);
    expect(isMermaidDiagramSource("SELECT 1", "sql")).toBe(false);
  });

  it("sanitizes render ids", () => {
    expect(sanitizeMermaidRenderId(":r1:help-mermaid-1")).toBe("r1help-mermaid-1");
  });

  it("removes mermaid bind and error nodes left on document.body", () => {
    const bind = document.createElement("div");
    bind.id = "darch-diagram-r1";
    const iframe = document.createElement("iframe");
    iframe.id = "iarch-diagram-r1";
    const errorSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    errorSvg.id = "arch-diagram-r1";
    document.body.appendChild(bind);
    document.body.appendChild(iframe);
    document.body.appendChild(errorSvg);

    removeMermaidRenderBindElement("  ");
    expect(document.getElementById("darch-diagram-r1")).not.toBeNull();
    expect(document.getElementById("iarch-diagram-r1")).not.toBeNull();

    removeMermaidRenderBindElement("arch-diagram-r1");
    expect(document.getElementById("darch-diagram-r1")).toBeNull();
    expect(document.getElementById("iarch-diagram-r1")).toBeNull();
    expect(document.getElementById("arch-diagram-r1")).toBeNull();
  });

  it("makes Mermaid SVG fill the container width", () => {
    const prepared = prepareMermaidSvgForResponsiveLayout(
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="90" style="max-width: 180px;" viewBox="0 0 180 90" data-testid="rendered-mermaid"></svg>',
    );

    expect(prepared).toContain('width="100%"');
    expect(prepared).toContain('viewBox="0 0 180 90"');
    expect(prepared).not.toMatch(/max-width:\s*180px/i);
    expect(prepared).not.toMatch(/\sheight="/);
  });

  it("derives viewBox when Mermaid omits it", () => {
    const prepared = prepareMermaidSvgForResponsiveLayout(
      '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120"></svg>',
    );

    expect(prepared).toContain('viewBox="0 0 240 120"');
    expect(prepared).toContain('width="100%"');
  });

  it("fits a live SVG element to the host width using content bounds", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "10");
    rect.setAttribute("y", "20");
    rect.setAttribute("width", "100");
    rect.setAttribute("height", "40");
    group.appendChild(rect);
    svg.appendChild(group);
    document.body.appendChild(svg);

    // jsdom getBBox is incomplete; stub content bounds for the fit helper.
    const graphics = group as SVGGraphicsElement;
    graphics.getBBox = () =>
      ({
        x: 10,
        y: 20,
        width: 100,
        height: 40,
        top: 20,
        right: 110,
        bottom: 60,
        left: 10,
        toJSON: () => ({}),
      }) as DOMRect;

    fitMermaidSvgElementToHost(svg, 500, 10);

    expect(svg.getAttribute("viewBox")).toBe("0 10 120 60");
    expect(svg.getAttribute("width")).toBe("500");
    expect(svg.getAttribute("height")).toBe("280");
    expect(svg.style.width).toBe("500px");
    expect(svg.style.height).toBe("280px");

    svg.remove();
  });

  it("uses parent g.nodes bounds instead of unmapped local .node boxes", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodesGroup.setAttribute("class", "nodes");
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("class", "node");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    node.appendChild(rect);
    nodesGroup.appendChild(node);
    svg.appendChild(nodesGroup);
    document.body.appendChild(svg);

    const localNode = node as SVGGraphicsElement;
    localNode.getScreenCTM = () => null;
    localNode.getBBox = () =>
      ({
        x: -40,
        y: -14,
        width: 80,
        height: 28,
        top: -14,
        right: 40,
        bottom: 14,
        left: -40,
        toJSON: () => ({}),
      }) as DOMRect;

    const parentGroup = nodesGroup as SVGGraphicsElement;
    parentGroup.getBBox = () =>
      ({
        x: 360,
        y: 70,
        width: 180,
        height: 48,
        top: 70,
        right: 540,
        bottom: 118,
        left: 360,
        toJSON: () => ({}),
      }) as DOMRect;

    fitMermaidSvgElementToHost(svg, 500, 10);

    expect(svg.getAttribute("viewBox")).toBe("350 60 200 68");

    svg.remove();
  });

  it("prefers g.nodes ink when mapped node boxes collapse to the origin", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodesGroup.setAttribute("class", "nodes");
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("class", "node");
    node.setAttribute("transform", "translate(360, 70)");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "180");
    rect.setAttribute("height", "48");
    node.appendChild(rect);
    nodesGroup.appendChild(node);
    svg.appendChild(nodesGroup);
    document.body.appendChild(svg);

    const identityMatrix = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
      inverse: () => identityMatrix,
      multiply: () => identityMatrix,
    };

    const localNode = node as SVGGraphicsElement;
    localNode.getScreenCTM = () => identityMatrix as DOMMatrix;
    localNode.getBBox = () =>
      ({
        x: -40,
        y: -14,
        width: 80,
        height: 28,
        top: -14,
        right: 40,
        bottom: 14,
        left: -40,
        toJSON: () => ({}),
      }) as DOMRect;

    svg.getScreenCTM = () => identityMatrix as DOMMatrix;

    const parentGroup = nodesGroup as SVGGraphicsElement;
    parentGroup.getBBox = () =>
      ({
        x: 360,
        y: 70,
        width: 180,
        height: 48,
        top: 70,
        right: 540,
        bottom: 118,
        left: 360,
        toJSON: () => ({}),
      }) as DOMRect;

    fitMermaidSvgElementToViewport(svg, 1000, 360, 10);

    expect(svg.getAttribute("viewBox")).toBe("350 60 200 68");

    svg.remove();
  });

  it("keeps a stable fit budget when the viewport client height is collapsed", () => {
    const viewport = document.createElement("div");
    viewport.style.width = "1000px";
    viewport.style.maxHeight = "36rem";
    viewport.style.padding = "16px";
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 1000 });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 48 });
    document.body.appendChild(viewport);

    const budget = readMermaidViewportFitBudget(viewport);

    expect(budget.heightPx).toBeGreaterThanOrEqual(MERMAID_VIEWPORT_STABLE_MIN_HEIGHT_PX);
    expect(budget.heightPx).toBeLessThanOrEqual(MERMAID_VIEWPORT_MAX_HEIGHT_PX);

    viewport.remove();
  });

  it("does not re-crop viewBox on a second viewport contain-fit pass", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100");
    rect.setAttribute("height", "100");
    group.appendChild(rect);
    svg.appendChild(group);
    document.body.appendChild(svg);

    const graphics = group as SVGGraphicsElement;
    graphics.getBBox = () =>
      ({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    fitMermaidSvgElementToViewport(svg, 400, 400, 10);
    const firstViewBox = svg.getAttribute("viewBox");

    fitMermaidSvgElementToViewport(svg, 200, 200, 10);

    expect(svg.getAttribute("viewBox")).toBe(firstViewBox);
    expect(Number(svg.getAttribute("height"))).toBeLessThanOrEqual(200);

    svg.remove();
  });

  it("uses a stable height fallback when ink bbox is unavailable in viewport fit", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svg);

    const baseFit = fitMermaidSvgElementToViewport(svg, 800, 360, 10);

    expect(baseFit).not.toBeNull();
    expect(Number(svg.getAttribute("height"))).toBeGreaterThanOrEqual(MERMAID_VIEWPORT_STABLE_MIN_HEIGHT_PX);
    expect(svg.style.height).not.toBe("auto");

    svg.remove();
  });

  it("contains tall narrow ink inside a bounded viewport without width-stretching height", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "200");
    rect.setAttribute("height", "900");
    group.appendChild(rect);
    svg.appendChild(group);
    document.body.appendChild(svg);

    const graphics = group as SVGGraphicsElement;
    graphics.getBBox = () =>
      ({
        x: 0,
        y: 0,
        width: 200,
        height: 900,
        top: 0,
        right: 200,
        bottom: 900,
        left: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    const baseFit = fitMermaidSvgElementToViewport(svg, 1000, 360, 10);

    expect(baseFit).not.toBeNull();
    expect(Number(svg.getAttribute("height"))).toBeLessThanOrEqual(360);
    expect(Number(svg.getAttribute("width"))).toBeLessThanOrEqual(1000);

    svg.remove();
  });

  it("applies layout-affecting zoom on top of a viewport contain-fit", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100");
    rect.setAttribute("height", "100");
    group.appendChild(rect);
    svg.appendChild(group);
    document.body.appendChild(svg);

    const graphics = group as SVGGraphicsElement;
    graphics.getBBox = () =>
      ({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    const baseFit = fitMermaidSvgElementToViewport(svg, 400, 400, 10);

    expect(baseFit).not.toBeNull();

    applyMermaidSvgViewportZoom(svg, baseFit!, 2);

    expect(svg.getAttribute("width")).toBe(String(baseFit!.baseWidthPx * 2));
    expect(svg.getAttribute("height")).toBe(String(baseFit!.baseHeightPx * 2));

    svg.remove();
  });

  it("treats null viewport fit as unpainted ink", () => {
    expect(isMermaidViewportPaintTooSmall(null, 1)).toBe(true);
  });

  it("treats tiny fitted ink height as unpainted", () => {
    expect(isMermaidViewportPaintTooSmall({ baseWidthPx: 100, baseHeightPx: 20 }, 1)).toBe(true);
    expect(isMermaidViewportPaintTooSmall({ baseWidthPx: 100, baseHeightPx: 15 }, 1.5)).toBe(true);
    expect(isMermaidViewportPaintTooSmall({ baseWidthPx: 100, baseHeightPx: 20 }, 1.5)).toBe(false);
    expect(isMermaidViewportPaintTooSmall({ baseWidthPx: 100, baseHeightPx: 24 }, 1)).toBe(false);
  });
});
