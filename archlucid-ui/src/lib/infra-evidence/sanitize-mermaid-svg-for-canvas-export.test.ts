import { describe, expect, it } from "vitest";

import { sanitizeMermaidSvgForCanvasExport } from "@/lib/infra-evidence/sanitize-mermaid-svg-for-canvas-export";

describe("sanitizeMermaidSvgForCanvasExport", () => {
  it("removes foreignObject nodes that taint canvas export", () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>label</div></foreignObject><rect width="10" height="10"/></svg>';

    const output = sanitizeMermaidSvgForCanvasExport(input);

    expect(output).not.toContain("foreignObject");
    expect(output).toContain("<rect");
  });

  it("removes external image and style imports", () => {
    const input = [
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
      '<style>@import url("https://fonts.googleapis.com/css?family=Inter"); .node { fill: url(https://cdn.example/icon.png); }</style>',
      '<image href="https://cdn.example/icon.png" width="16" height="16"/>',
      '<rect width="10" height="10"/>',
      "</svg>",
    ].join("");

    const output = sanitizeMermaidSvgForCanvasExport(input);

    expect(output).not.toContain("fonts.googleapis.com");
    expect(output).not.toContain("<image");
    expect(output).toContain("<rect");
  });

  it("keeps same-origin fragment references intact", () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"/></defs><rect fill="url(#g)" width="10" height="10"/></svg>';

    const output = sanitizeMermaidSvgForCanvasExport(input);

    expect(output).toContain('fill="url(#g)"');
  });
});
