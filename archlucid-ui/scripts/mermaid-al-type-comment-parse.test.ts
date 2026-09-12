import { describe, expect, it } from "vitest";

import { stripInlineMermaidFlowchartComments } from "@/lib/mermaid/strip-inline-mermaid-flowchart-comments";

/** Lives under scripts/ so it can import mermaid without violating the src/ dynamic-import allowlist (TB-863). */
describe("mermaid.parse inventory al-type comments", () => {
  it("rejects inline %% comments and accepts own-line comments", async () => {
    const mermaidModule = await import("mermaid");
    const mermaid = mermaidModule.default;
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

    const inlineComment = ['flowchart TD', '    n1["app-hi-test-wus-001"] %% al-type=microsoft'].join("\n");
    const ownLineComment = [
      "flowchart TD",
      "    %% al-type=microsoft",
      '    n1["app-hi-test-wus-001"]',
    ].join("\n");

    await expect(mermaid.parse(inlineComment)).rejects.toThrow(/NODE_STRING|Parse error/u);
    await expect(mermaid.parse(ownLineComment)).resolves.toBeTruthy();
    await expect(mermaid.parse(stripInlineMermaidFlowchartComments(inlineComment))).resolves.toBeTruthy();
  });
});
