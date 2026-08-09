import { describe, expect, it } from "vitest";

import {
  buildEvidenceBackedIntakeBrief,
  isFirstPilotIntakeReady,
  normalizeFirstPilotReviewTitle,
} from "@/lib/first-pilot-intake";

describe("first-pilot-intake", () => {
  it("buildEvidenceBackedIntakeBrief auto-tags uploaded files and meets minimum length", () => {
    const brief = buildEvidenceBackedIntakeBrief(
      "Claims intake modernization",
      [new File(["diagram"], "network-topology.pdf", { type: "application/pdf" })],
      "",
    );

    expect(brief).toContain("Claims intake modernization");
    expect(brief).toContain("network-topology.pdf");
    expect(brief).toContain("Attached files:");
    expect(brief).not.toContain("Attached architecture evidence:");
    expect(brief.length).toBeGreaterThanOrEqual(100);
  });

  it("isFirstPilotIntakeReady accepts title plus evidence without a long brief", () => {
    expect(
      isFirstPilotIntakeReady({
        title: "Retail API",
        brief: "",
        evidenceFileCount: 1,
      }),
    ).toBe(true);
  });

  it("isFirstPilotIntakeReady requires a title", () => {
    expect(
      isFirstPilotIntakeReady({
        title: " ",
        brief: "x".repeat(120),
        evidenceFileCount: 0,
      }),
    ).toBe(false);
  });

  it("normalizeFirstPilotReviewTitle falls back when title is too short", () => {
    expect(normalizeFirstPilotReviewTitle("  ")).toBe("Architecture review");
  });
});
