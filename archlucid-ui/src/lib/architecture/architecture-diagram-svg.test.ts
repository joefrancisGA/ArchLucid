import { describe, expect, it } from "vitest";

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

  it("paints node boxes and edge paths that have no stroke so the graph is not invisible", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">',
      '  <g class="node"><rect width="80" height="32" x="10" y="10" fill="none"/></g>',
      '  <g class="edgePaths"><path d="M10 26 L90 26"/></g>',
      "</svg>",
    ].join("");

    const converted = replaceMermaidForeignObjectLabelsWithSvgText(svg);

    expect(converted).toContain('stroke="currentColor"');
    expect(converted).toContain('stroke-width="1.5"');
    expect(converted).toContain('fill-opacity="0.12"');
    expect(converted).toMatch(/<path[^>]*fill="none"/);
  });
});
