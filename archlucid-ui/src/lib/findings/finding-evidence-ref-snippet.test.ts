import { describe, expect, it } from "vitest";

import { collectEvidenceRefSnippets, normalizeEvidenceRefSnippet } from "@/lib/findings/finding-evidence-ref-snippet";

describe("finding-evidence-ref-snippet", () => {
  it("normalizeEvidenceRefSnippet strips scheme prefixes", () => {
    expect(normalizeEvidenceRefSnippet("evidence://claims-api/schema#memberId")).toBe("claims-api/schema#memberId");
  });

  it("collectEvidenceRefSnippets caps list length", () => {
    const snippets = collectEvidenceRefSnippets(["a", "b", "c", "d"], 2);

    expect(snippets).toEqual(["a", "b"]);
  });
});
