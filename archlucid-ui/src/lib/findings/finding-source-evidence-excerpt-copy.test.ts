import { describe, expect, it } from "vitest";

import {
  resolveFindingEvidenceRefSnippetsWireState,
  SOURCE_EVIDENCE_EXCERPTS_NOT_STORED,
  SOURCE_EVIDENCE_EXCERPTS_STORED_EMPTY,
} from "@/lib/findings/finding-source-evidence-excerpt-copy";

describe("finding-source-evidence-excerpt-copy", () => {
  it("classifies missing, stored-empty, and present excerpt lists", () => {
    expect(resolveFindingEvidenceRefSnippetsWireState(undefined)).toBe("missing");
    expect(resolveFindingEvidenceRefSnippetsWireState([])).toBe("stored-empty");
    expect(resolveFindingEvidenceRefSnippetsWireState(["excerpt"])).toBe("present");
    expect(SOURCE_EVIDENCE_EXCERPTS_NOT_STORED).toContain("not stored");
    expect(SOURCE_EVIDENCE_EXCERPTS_STORED_EMPTY).toContain("stored empty");
  });
});
