import { describe, expect, it } from "vitest";

import {
  collectEvidenceRefSnippets,
  countStoredEvidenceRefSnippets,
  formatFindingEvidenceRefSnippetsHeading,
  normalizeEvidenceRefSnippet,
} from "./finding-evidence-ref-snippet";

describe("finding-evidence-ref-snippet preview-cap batch", () => {
  it("adds continuation honesty when snippet exceeds 240 characters", () => {
    const long = "x".repeat(300);
    const snippet = normalizeEvidenceRefSnippet(long);

    expect(snippet).toContain("Full evidence ref was stored");
  });

  it("formats partial list heading when wire refs exceed display limit", () => {
    const raw = ["a", "b", "c", "d"];
    const displayed = collectEvidenceRefSnippets(raw, 3);

    expect(displayed).toHaveLength(3);
    expect(formatFindingEvidenceRefSnippetsHeading(displayed, countStoredEvidenceRefSnippets(raw))).toBe(
      "Source evidence (showing 3 of 4 stored refs)",
    );
  });
});
