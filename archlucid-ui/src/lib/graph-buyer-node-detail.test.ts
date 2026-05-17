import { describe, expect, it } from "vitest";

import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";

import { graphBuyerTrailDispositionLine, graphBuyerTrailMetadataLines } from "@/lib/graph-buyer-node-detail";

describe("graphBuyerTrailDispositionLine", () => {
  it("returns curated disposition copy for the showcase PHI finding reference id", () => {
    expect(
      graphBuyerTrailDispositionLine("Finding", {
        referenceId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
      }),
    ).toContain("Accepted with monitoring");
  });

  it("returns API disposition field when present", () => {
    expect(
      graphBuyerTrailDispositionLine("Finding", {
        disposition: "Hold — blocking until remediation",
      }),
    ).toBe("Hold — blocking until remediation");
  });

  it("returns null for non-finding nodes", () => {
    expect(graphBuyerTrailDispositionLine("GoldenManifest", { disposition: "x" })).toBeNull();
  });
});

describe("graphBuyerTrailMetadataLines", () => {
  it("maps referenced slug to primary risk and preserves raw reference as technical", () => {
    const { summaryLines, technicalLines } = graphBuyerTrailMetadataLines({
      referenced: "phi-minimization-risk",
    });

    expect(summaryLines.some((l) => l.label === "Primary risk" && l.value === "PHI Minimization Risk")).toBe(true);
    expect(technicalLines.some((l) => l.label.includes("Raw reference"))).toBe(true);
  });

  it("adds risk area and why it matters when referenceId is the showcase PHI finding", () => {
    const { summaryLines, technicalLines } = graphBuyerTrailMetadataLines({
      referenceId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    });

    expect(summaryLines.some((l) => l.label === "Risk area")).toBe(true);
    expect(summaryLines.some((l) => l.label === "Why it matters")).toBe(true);
    expect(summaryLines.some((l) => l.label === "Severity" && l.value === "High")).toBe(true);
    expect(summaryLines.some((l) => l.label === "Blocking status")).toBe(true);
    expect(summaryLines.some((l) => l.label === "Monitoring cadence")).toBe(true);
    expect(technicalLines.some((l) => l.label === "Reference ID")).toBe(true);
  });
});
