import { describe, expect, it } from "vitest";

import { appendDataFlowRollupMemberLegend } from "@/lib/infra-evidence/export-mermaid-source-to-png";

describe("appendDataFlowRollupMemberLegend", () => {
  it("adds rollup members to an export legend without throwing", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">',
      '<g class="node" data-member-names="acct-a · rg-a · No consumer found|acct-b · rg-b · Used by 1">',
      "<title>2 storage accounts</title>",
      "</g>",
      "</svg>",
    ].join("");

    const result = appendDataFlowRollupMemberLegend(svg);

    expect(result).toContain('class="rollup-member-legend"');
    expect(result).toContain("[1] 2 storage accounts");
    expect(result).toContain("acct-a · rg-a · No consumer found");
    expect(result).toContain("acct-b · rg-b · Used by 1");
    expect(result).toContain('viewBox="0 0 240 164"');
  });

  it("leaves an SVG without rollup members unchanged", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><rect /></svg>';

    expect(appendDataFlowRollupMemberLegend(svg)).toBe(svg);
  });
});
