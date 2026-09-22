import { describe, expect, it } from "vitest";

import { stripInlineMermaidFlowchartComments } from "@/lib/mermaid/strip-inline-mermaid-flowchart-comments";

describe("stripInlineMermaidFlowchartComments", () => {
  it("removes an inline comment after a quoted node label", () => {
    const source = ['flowchart TD', '    n1["app-hi-test-wus-001"] %% al-type=microsoft'].join("\n");

    expect(stripInlineMermaidFlowchartComments(source)).toBe(
      ['flowchart TD', '    n1["app-hi-test-wus-001"]'].join("\n"),
    );
  });

  it("keeps comments that already occupy their own line", () => {
    const source = [
      "flowchart TD",
      "    %% al-type=Microsoft.Network/networkInterfaces al-rg=rg-network",
      '    n_a1["nic-prod"]',
    ].join("\n");

    expect(stripInlineMermaidFlowchartComments(source)).toBe(source);
  });

  it("does not truncate quoted labels that contain percent signs", () => {
    expect(stripInlineMermaidFlowchartComments('    n1["rate%%off"] %% al-rg=rg-network')).toBe(
      '    n1["rate%%off"]',
    );
  });
});
