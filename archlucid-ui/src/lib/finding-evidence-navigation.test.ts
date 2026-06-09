import { describe, expect, it } from "vitest";

import { getFindingEvidenceInspectHref } from "@/lib/finding-evidence-navigation";

describe("getFindingEvidenceInspectHref", () => {
  it("builds the inspect route for a finding", () => {
    expect(getFindingEvidenceInspectHref("run-1", "finding-9")).toBe("/reviews/run-1/findings/finding-9/inspect");
  });
});
