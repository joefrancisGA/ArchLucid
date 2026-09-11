import { describe, expect, it } from "vitest";

import {
  fitMermaidSvgElementToHost,
  isMermaidDiagramSource,
  prepareMermaidSvgForResponsiveLayout,
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
    localNode.getCTM = () => null;
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
});
