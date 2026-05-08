import { describe, expect, it } from "vitest";

import { graphBuyerTrailMetadataLines } from "@/lib/graph-buyer-node-detail";

describe("graphBuyerTrailMetadataLines", () => {
  it("maps referenced slug to primary risk and preserves raw reference as technical", () => {
    const { summaryLines, technicalLines } = graphBuyerTrailMetadataLines({
      referenced: "phi-minimization-risk",
    });

    expect(summaryLines.some((l) => l.label === "Primary risk" && l.value === "PHI Minimization Risk")).toBe(true);
    expect(technicalLines.some((l) => l.label.includes("Raw reference"))).toBe(true);
  });
});
