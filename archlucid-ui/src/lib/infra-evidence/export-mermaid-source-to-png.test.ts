import { describe, expect, it, vi } from "vitest";

import {
  appendDataFlowRollupMemberLegend,
  exportSanitizedMermaidSvgMarkupToPngBlob,
} from "@/lib/infra-evidence/export-mermaid-source-to-png";

describe("appendDataFlowRollupMemberLegend", () => {
  it("adds rollup members to an export legend without throwing", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">',
      '<g class="node" data-member-names="acct-a · rg-a · No diagram neighbor on this view.|acct-b · rg-b · 1 diagram neighbors on this view.">',
      "<title>2 storage accounts</title>",
      "</g>",
      "</svg>",
    ].join("");

    const result = appendDataFlowRollupMemberLegend(svg);

    expect(result).toContain('class="rollup-member-legend"');
    expect(result).toContain("[1] 2 storage accounts");
    expect(result).toContain("acct-a · rg-a · No diagram neighbor on this view.");
    expect(result).toContain("acct-b · rg-b · 1 diagram neighbors on this view.");
    expect(result).toContain('viewBox="0 0 240 164"');
  });

  it("leaves an SVG without rollup members unchanged", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><rect /></svg>';

    expect(appendDataFlowRollupMemberLegend(svg)).toBe(svg);
  });
});

describe("exportSanitizedMermaidSvgMarkupToPngBlob", () => {
  it("uses the viewBox size when the SVG origin is negative", async () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const png = new Blob(["rendered"], { type: "image/png" });
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(png));
    vi.stubGlobal("Image", class {
      onload?: () => void;

      set src(_value: string) {
        this.onload?.();
      }
    });

    try {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -20 320 180"><rect /></svg>';

      expect(await exportSanitizedMermaidSvgMarkupToPngBlob(svg)).toBe(png);
      expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 320, 180);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
