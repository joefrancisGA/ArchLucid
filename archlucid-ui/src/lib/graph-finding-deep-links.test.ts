import { describe, expect, it } from "vitest";

import {
  FINDING_EVIDENCE_GRAPH_DEFAULT_MODE,
  getFindingEvidenceGraphHref,
  graphTrailHrefWithOptionalNode,
  SHIPPED_EVIDENCE_GRAPH_MODES,
} from "@/lib/graph-finding-deep-links";

describe("graph-finding-deep-links (TB-1361)", () => {
  it("uses provenance-full for finding graph deep links", () => {
    expect(FINDING_EVIDENCE_GRAPH_DEFAULT_MODE).toBe("provenance-full");
    expect(SHIPPED_EVIDENCE_GRAPH_MODES).toContain(FINDING_EVIDENCE_GRAPH_DEFAULT_MODE);

    const href = getFindingEvidenceGraphHref("run-1", "n-phi");

    expect(href).toContain("/insights/evidence-graph");
    expect(href).toContain("runId=run-1");
    expect(href).toContain("mode=provenance-full");
    expect(href).toContain("graphNodeId=n-phi");
    expect(href).not.toContain("review-trail");
  });

  it("delegates graphTrailHrefWithOptionalNode to getFindingEvidenceGraphHref", () => {
    expect(graphTrailHrefWithOptionalNode("run-2", null)).toBe(getFindingEvidenceGraphHref("run-2"));
  });
});
