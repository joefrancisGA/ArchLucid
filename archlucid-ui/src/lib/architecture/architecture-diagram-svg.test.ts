import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE,
} from "@/lib/architecture/architecture-diagram-mermaid-config";
import {
  replaceMermaidForeignObjectLabelsWithSvgText,
  sanitizeArchitectureDiagramSvg,
} from "@/lib/architecture/architecture-diagram-svg";

const LABELED_FOREIGN_OBJECT_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">',
  '  <g class="node" transform="translate(120, 40)">',
  '    <rect width="160" height="36" x="-80" y="-18" fill="#ececec" stroke="#999"/>',
  '    <g class="label">',
  '      <foreignObject width="160" height="36" x="-80" y="-18">',
  '        <div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel">vnet-eastus</span></div>',
  "      </foreignObject>",
  "    </g>",
  "  </g>",
  "</svg>",
].join("");

const FOREST_PAINT_FIXTURE = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">',
  '  <g class="node">',
  '    <rect class="node-card" width="200" height="48" fill="#ececec" stroke="#999"/>',
  '    <rect class="node-accent" width="4" height="48" fill="#0f766e"/>',
  '    <g class="pictogram"><circle cx="8" cy="8" r="6" fill="#0f766e"/></g>',
  "  </g>",
  "</svg>",
].join("");

const AZURE_ICON_FIXTURE = [
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
  '  <g class="node">',
  '    <rect class="node-card" width="200" height="48"/>',
  '    <rect class="node-accent" width="4" height="48" fill="#2563eb"/>',
  '    <image class="azure-icon" data-file="virtual-machine.png"',
  '      href="data:image/png;base64,iVBORw0KGgo="',
  '      xlink:href="data:image/png;base64,iVBORw0KGgo="/>',
  "  </g>",
  "</svg>",
].join("");

describe("architecture-diagram-svg", () => {
  it("converts Mermaid foreignObject labels into visible SVG text", () => {
    const converted = replaceMermaidForeignObjectLabelsWithSvgText(LABELED_FOREIGN_OBJECT_SVG);

    expect(converted).toContain("vnet-eastus");
    expect(converted).toContain("nodeLabel");
    expect(converted).not.toContain("foreignObject");
  });

  it("keeps resource names after sanitizing script and leftover foreignObject", () => {
    const malicious = LABELED_FOREIGN_OBJECT_SVG.replace(
      "</svg>",
      '<script>alert(1)</script></svg>',
    );

    const sanitized = sanitizeArchitectureDiagramSvg(malicious);

    expect(sanitized).toContain("vnet-eastus");
    expect(sanitized).not.toContain("foreignObject");
    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("alert(1)");
  });

  it("paints SVG text that only had fill none so labels are not invisible", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><text class="nodeLabel" fill="none">vnet-westus</text></svg>';

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);

    expect(converted).toContain("vnet-westus");
    expect(converted).toContain('fill="currentColor"');
  });

  it("paints node boxes and edge paths with the neutral export palette", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">',
      '  <g class="node"><rect width="80" height="32" x="10" y="10" fill="none"/></g>',
      '  <g class="edgePaths"><path d="M10 26 L90 26"/></g>',
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);

    expect(converted).toContain(`fill="${ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.fill}"`);
    expect(converted).toContain(`stroke="${ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.border}"`);
    expect(converted).toContain('stroke-width="1.5"');
    expect(converted).not.toContain('fill-opacity="0.12"');
    expect(converted).toMatch(/<path[^>]*fill="none"/);
    expect(converted).toContain(`stroke="${ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.edge}"`);
  });

  it("replaces neutral mermaid gray node fills with slate cards before raster export", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">',
      '  <g class="node"><rect width="80" height="32" x="10" y="10" fill="#ececec" stroke="#999"/></g>',
      "</svg>",
    ].join("");

    const converted = sanitizeArchitectureDiagramSvg(svg);

    expect(converted).toContain(`fill="${ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.fill}"`);
    expect(converted).toContain(`stroke="${ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.border}"`);
    expect(converted).not.toContain('fill="#ececec"');
    expect(converted).not.toContain("#D4A84B");
  });

  it("preserves pictogram and accent fills on forest-like snippets", () => {
    const converted = sanitizeArchitectureDiagramSvg(FOREST_PAINT_FIXTURE);

    expect(converted).toContain('class="node-card"');
    expect(converted).toContain(`fill="${ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.fill}"`);
    expect(converted).toContain('class="node-accent"');
    expect(converted).toContain('fill="#0f766e"');
    expect(converted).toMatch(/<circle[^>]*fill="#0f766e"/);
  });

  it("preserves embedded Azure PNG icons but rejects remote image URLs", () => {
    const converted = sanitizeArchitectureDiagramSvg(AZURE_ICON_FIXTURE);
    const remote = sanitizeArchitectureDiagramSvg(
      AZURE_ICON_FIXTURE.replace(
        "data:image/png;base64,iVBORw0KGgo=",
        "https://example.invalid/icon.png",
      ),
    );

    expect(converted).toContain('class="azure-icon"');
    expect(converted).toContain("data-file=\"virtual-machine.png\"");
    expect(converted).toContain("data:image/png;base64,iVBORw0KGgo=");
    expect(converted).toContain('fill="#2563eb"');
    expect(remote).not.toContain("https://example.invalid/icon.png");
  });

  it("wraps long foreignObject names into tspans that fit the node rect", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">',
      '  <g class="node" transform="translate(120, 40)">',
      '    <rect width="160" height="36" x="-80" y="-18" fill="#ececec" stroke="#999"/>',
      '    <g class="label">',
      '      <foreignObject width="160" height="36" x="-80" y="-18">',
      '        <div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel">Azure Kubernetes Service (AKS) Cluster</span></div>',
      "      </foreignObject>",
      "    </g>",
      "  </g>",
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);

    expect(converted).toContain("Azure Kubernetes");
    expect(converted).toContain("tspan");
    expect(converted).not.toContain("foreignObject");
    expect(converted.match(/<tspan /g)?.length ?? 0).toBeGreaterThan(1);
    const rectHeight = Number.parseFloat(converted.match(/<rect[^>]*height="([^"]+)"/)?.[1] ?? "0");
    expect(rectHeight).toBeGreaterThan(36);
  });

  it("preserves mermaid <br> line breaks when converting labels", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '  <g class="node">',
      '    <rect width="160" height="48" x="-80" y="-24"/>',
      '    <foreignObject width="160" height="48" x="-80" y="-24">',
      '      <div xmlns="http://www.w3.org/1999/xhtml">Azure Kubernetes Service<br/>(AKS) Cluster</div>',
      "    </foreignObject>",
      "  </g>",
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);

    expect(converted).toContain("Azure Kubernetes Service");
    expect(converted).toContain("(AKS) Cluster");
    expect(converted.match(/<tspan /g)?.length ?? 0).toBeGreaterThan(1);
  });

  it("bolds inventory-forest rg-frame labels", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">',
      '  <g class="rg-frames">',
      '    <g class="rg-frame">',
      '      <rect x="20" y="60" width="200" height="100"/>',
      '      <text x="20" y="56" font-size="11">rg-app-prod</text>',
      "    </g>",
      "  </g>",
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);

    expect(converted).toContain('class="clusterLabelText"');
    expect(converted).toContain('font-weight="700"');
    expect(converted).toContain("rg-app-prod");
  });

  it("bolds resource group cluster captions above the dashed frame", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">',
      '  <g class="cluster" id="rg-anly-edw">',
      '    <rect class="cluster_rect" x="20" y="60" width="200" height="100"/>',
      '    <g class="cluster-label" transform="translate(30, 150)">',
      '      <foreignObject width="160" height="24" x="-80" y="-12">',
      '        <div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel">RG anly-edw-ppd-hi</span></div>',
      "      </foreignObject>",
      "    </g>",
      "  </g>",
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);

    expect(converted).toContain('class="clusterLabelText"');
    expect(converted).toContain('font-weight="700"');
    expect(converted).toContain('text-anchor="start"');
    expect(converted).toMatch(/y="5[0-9]"/);
  });

  it("wraps native SVG node text that overruns a narrow rect", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '  <g class="node">',
      '    <rect width="160" height="36" x="-80" y="-18"/>',
      '    <text class="nodeLabel" x="0" y="0">Azure Kubernetes Service (AKS) Cluster</text>',
      "  </g>",
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);

    expect(converted.match(/<tspan /g)?.length ?? 0).toBeGreaterThan(1);
    expect(converted).toContain("Azure Kubernetes");
  });

  it("emits cluster foreignObject labels as cluster-label, not nodeLabel", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120">',
      '  <g class="cluster">',
      '    <rect width="200" height="80" x="0" y="0"/>',
      '    <foreignObject width="120" height="20" x="4" y="4">',
      '      <div xmlns="http://www.w3.org/1999/xhtml">RG app-hi-test</div>',
      "    </foreignObject>",
      '    <g class="node">',
      '      <rect width="160" height="36" x="20" y="20"/>',
      '      <text class="nodeLabel" x="100" y="38">vnet-app-hi-test-wus-001</text>',
      "    </g>",
      "  </g>",
      "</svg>",
    ].join("");

    const sanitized = sanitizeArchitectureDiagramSvg(svg);

    expect(sanitized).toContain("cluster-label");
    expect(sanitized).toContain("RG app-hi-test");
    expect(sanitized).toContain("vnet-app-hi-test-wus-001");
    expect(sanitized.match(/class="nodeLabel"/g)?.length ?? 0).toBe(1);
    expect(sanitized.match(/vnet-app-hi-test-wus-001/g)?.length ?? 0).toBe(1);
    expect(sanitized).not.toMatch(/class="cluster-label"[^>]*class="nodeLabel"/);
  });

  it("removes duplicate cluster foreignObject when native cluster-label already exists", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120">',
      '  <g class="cluster">',
      '    <rect width="200" height="80" x="0" y="0"/>',
      '    <text class="cluster-label" x="4" y="8">RG app-hi-test</text>',
      '    <foreignObject width="120" height="20" x="4" y="4">',
      '      <div xmlns="http://www.w3.org/1999/xhtml">RG app-hi-test</div>',
      "    </foreignObject>",
      '    <g class="node"><rect width="160" height="36" x="20" y="20"/></g>',
      "  </g>",
      "</svg>",
    ].join("");

    const sanitized = sanitizeArchitectureDiagramSvg(svg);

    expect(sanitized.match(/RG app-hi-test/g)?.length ?? 0).toBe(1);
    expect(sanitized).not.toContain("foreignObject");
  });

  it("does not recenter forest cards that already have name and RG text", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120">',
      '  <g class="node">',
      '    <rect width="160" height="48" x="20" y="20"/>',
      '    <g class="pictogram"><rect width="12" height="12" x="28" y="28"/></g>',
      '    <text x="44" y="36"><tspan x="44" y="36">vnet-app-hi-test-wus-001-extra-long-name</tspan></text>',
      '    <text x="44" y="52"><tspan x="44" y="52">rg-app-hi-test</tspan></text>',
      "  </g>",
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);
    const nameTextMatch = converted.match(/<text[^>]*>\s*<tspan[^>]*x="44"[^>]*y="36"/);

    expect(nameTextMatch).not.toBeNull();
    expect(converted.match(/<text /g)?.length ?? 0).toBe(2);
    expect(converted).not.toContain('dy="-');
  });

  it("reserves a cluster title band above the first node when labels overlap", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">',
      '  <g class="cluster">',
      '    <rect width="180" height="80" x="0" y="0"/>',
      '    <text class="cluster-label" x="4" y="8" font-size="15">only app-hi-tst</text>',
      '    <g class="node">',
      '      <rect width="160" height="36" x="10" y="4"/>',
      '      <text class="nodeLabel" x="90" y="22">vnet-app-hi-tst</text>',
      "    </g>",
      "  </g>",
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);
    const labelY = Number.parseFloat(converted.match(/class="cluster-label"[^>]*y="([^"]+)"/)?.[1] ?? "999");
    const nodeTopY = Number.parseFloat(converted.match(/<g class="node">[\s\S]*?<rect[^>]*y="([^"]+)"/)?.[1] ?? "0");
    const fontSize = 15;
    const lineHeight = fontSize * 1.25;
    const labelBottomY = labelY + lineHeight;

    expect(labelBottomY).toBeLessThanOrEqual(nodeTopY + 1);
    expect(converted).toContain('class="cluster-label"');
  });

  it("leaves cluster rect geometry unchanged when cluster label is empty", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">',
      '  <g class="cluster">',
      '    <rect width="180" height="80" x="0" y="0"/>',
      '    <g class="node"><rect width="160" height="36" x="10" y="4"/></g>',
      "  </g>",
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);

    expect(converted).toContain('rect width="180" height="80" x="0" y="0"');
  });
});
