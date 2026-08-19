import { describe, expect, it } from "vitest";

import {
  countWords,
  truncateMarkdownPreservingStructure,
} from "@/lib/architecture/architecture-structured-narrative";

describe("architecture structured narrative helpers", () => {
  it("counts words in narrative text", () => {
    expect(countWords("one two three")).toBe(3);
    expect(countWords("  ")).toBe(0);
  });

  it("truncates long narrative while preserving markdown line breaks", () => {
    const words = Array.from({ length: 240 }, (_, index) => `word${index}`).join(" ");
    const markdown = `## Sponsor report\n\n${words}\n\n## Risks\n\n- Partner outage`;
    const result = truncateMarkdownPreservingStructure(markdown, 200);

    expect(result.truncated).toBe(true);
    expect(result.preview).toContain("## Sponsor report");
    expect(result.preview).not.toContain("## Risks");
    expect(result.preview).toContain("\n");
    expect(result.preview).not.toMatch(/^## Sponsor report word0 word1/);
  });

  it("keeps short markdown unchanged", () => {
    const markdown = "## Scope\n\nPrivate networking only.";
    const result = truncateMarkdownPreservingStructure(markdown, 200);

    expect(result.truncated).toBe(false);
    expect(result.preview).toBe(markdown);
  });
});
