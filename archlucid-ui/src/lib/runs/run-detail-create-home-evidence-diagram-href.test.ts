import { describe, expect, it } from "vitest";

import { buildRunDetailCreateHomeEvidenceDiagramHref } from "@/lib/runs/run-detail-create-home-evidence-diagram-href";

describe("buildRunDetailCreateHomeEvidenceDiagramHref", () => {
  it("links create-home Evidence to the Diagram archTab (TB-1848)", () => {
    const href = buildRunDetailCreateHomeEvidenceDiagramHref("run-abc");

    expect(href).toContain("/architecture/reviews/run-abc");
    expect(href).toContain("reviewTab=architecture");
    expect(href).toContain("fromGeneration=1");
    expect(href).toContain("intent=create-architecture");
  });
});
