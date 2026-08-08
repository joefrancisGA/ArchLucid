import { describe, expect, it } from "vitest";

import {
  buildEvidenceBackedIntakeBrief,
  describeFirstPilotIntakeGap,
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
    expect(brief).toContain("Architecture evidence");
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

  it("describeFirstPilotIntakeGap stays silent while the title is still empty", () => {
    expect(
      describeFirstPilotIntakeGap({ title: " ", brief: "", evidenceFileCount: 0 }),
    ).toBeNull();
  });

  it("describeFirstPilotIntakeGap asks for evidence or context once a title exists", () => {
    expect(
      describeFirstPilotIntakeGap({ title: "Retail API", brief: "", evidenceFileCount: 0 }),
    ).toBe("Attach evidence or add architecture context to start.");
  });

  it("describeFirstPilotIntakeGap names the shortfall once context has been started", () => {
    expect(
      describeFirstPilotIntakeGap({ title: "Retail API", brief: "x".repeat(40), evidenceFileCount: 0 }),
    ).toBe("Architecture context needs at least 100 characters (40 so far), or attach evidence instead.");
  });

  it("describeFirstPilotIntakeGap stays silent whenever submit is allowed", () => {
    expect(
      describeFirstPilotIntakeGap({ title: "Retail API", brief: "", evidenceFileCount: 1 }),
    ).toBeNull();
    expect(
      describeFirstPilotIntakeGap({ title: "Retail API", brief: "x".repeat(120), evidenceFileCount: 0 }),
    ).toBeNull();
  });
});
