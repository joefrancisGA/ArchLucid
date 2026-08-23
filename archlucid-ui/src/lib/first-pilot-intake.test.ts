import { describe, expect, it } from "vitest";

import {
  buildEvidenceBackedIntakeBrief,
  describeFirstPilotIntakeGap,
  describeFirstPilotStartBlocker,
  formatFirstPilotIntakeWriteDestination,
  isFirstPilotIntakeReady,
  normalizeFirstPilotReviewTitle,
} from "@/lib/first-pilot-intake";
import { UNIVERSAL_INTAKE_MUST_QUESTION_KEYS } from "@/lib/universal-intake-must-completeness";

const completeL0Must = {
  answers: Object.fromEntries(UNIVERSAL_INTAKE_MUST_QUESTION_KEYS.map((key) => [key, "answered"])),
  skippedQuestionKeys: new Set<string>(),
};

const emptyL0Must = {
  answers: {},
  skippedQuestionKeys: new Set<string>(),
};

const analyzableEvidenceDefaults = {
  evidenceFileNames: ["network-topology.pdf"] as const,
  limitedEvidenceAnalysisAcknowledged: false,
};

const qualityTitle = "Retail API modernization review";

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

  it("isFirstPilotIntakeReady accepts title plus analyzable evidence without a long brief when L0 is complete", () => {
    expect(
      isFirstPilotIntakeReady({
        title: qualityTitle,
        brief: "",
        evidenceFileCount: 1,
        ...analyzableEvidenceDefaults,
        l0Must: completeL0Must,
      }),
    ).toBe(true);
  });

  it("isFirstPilotIntakeReady rejects generic image-only evidence without acknowledgment (TB-2296)", () => {
    expect(
      isFirstPilotIntakeReady({
        title: qualityTitle,
        brief: "",
        evidenceFileCount: 1,
        evidenceFileNames: ["photo.png"],
        limitedEvidenceAnalysisAcknowledged: false,
        l0Must: completeL0Must,
      }),
    ).toBe(false);
  });

  it("isFirstPilotIntakeReady requires a title", () => {
    expect(
      isFirstPilotIntakeReady({
        title: " ",
        brief: "x".repeat(120),
        evidenceFileCount: 0,
        evidenceFileNames: [],
        limitedEvidenceAnalysisAcknowledged: false,
        l0Must: completeL0Must,
      }),
    ).toBe(false);
  });

  it("isFirstPilotIntakeReady requires L0 MUST clarifications even with evidence", () => {
    expect(
      isFirstPilotIntakeReady({
        title: qualityTitle,
        brief: "",
        evidenceFileCount: 1,
        ...analyzableEvidenceDefaults,
        l0Must: emptyL0Must,
      }),
    ).toBe(false);
  });

  it("isFirstPilotIntakeReady accepts a short project title when analyzable evidence is attached", () => {
    expect(
      isFirstPilotIntakeReady({
        title: "#Al-Lucid",
        brief: "",
        evidenceFileCount: 1,
        evidenceFileNames: ["ARCHITECTS_HANDBOOK_202409.docx"],
        limitedEvidenceAnalysisAcknowledged: false,
        l0Must: completeL0Must,
      }),
    ).toBe(true);
  });

  it("isFirstPilotIntakeReady still rejects banned placeholder titles with evidence", () => {
    expect(
      isFirstPilotIntakeReady({
        title: "Architecture review",
        brief: "",
        evidenceFileCount: 1,
        ...analyzableEvidenceDefaults,
        l0Must: completeL0Must,
      }),
    ).toBe(false);
  });

  it("isFirstPilotIntakeReady rejects activity-only titles without evidence", () => {
    expect(
      isFirstPilotIntakeReady({
        title: "Retail API review",
        brief: "",
        evidenceFileCount: 0,
        evidenceFileNames: [],
        limitedEvidenceAnalysisAcknowledged: false,
        l0Must: completeL0Must,
      }),
    ).toBe(false);
  });

  it("isFirstPilotIntakeReady accepts activity-style titles when evidence is attached", () => {
    expect(
      isFirstPilotIntakeReady({
        title: "Retail API review",
        brief: "",
        evidenceFileCount: 1,
        ...analyzableEvidenceDefaults,
        l0Must: completeL0Must,
      }),
    ).toBe(true);
  });

  it("normalizeFirstPilotReviewTitle trims without inventing a default title", () => {
    expect(normalizeFirstPilotReviewTitle("  ")).toBe("");
    expect(normalizeFirstPilotReviewTitle(qualityTitle)).toBe(qualityTitle);
  });

  it("describeFirstPilotIntakeGap names both title and evidence-or-context gates on cold load", () => {
    expect(
      describeFirstPilotIntakeGap({
        title: " ",
        brief: "",
        evidenceFileCount: 0,
        evidenceFileNames: [],
        limitedEvidenceAnalysisAcknowledged: false,
        l0Must: emptyL0Must,
      }),
    ).toBe("Add a review title and attach evidence or add architecture context (at least 100 characters) to start.");
  });

  it("describeFirstPilotIntakeGap asks for evidence or context once a quality title exists", () => {
    expect(
      describeFirstPilotIntakeGap({
        title: qualityTitle,
        brief: "",
        evidenceFileCount: 0,
        evidenceFileNames: [],
        limitedEvidenceAnalysisAcknowledged: false,
        l0Must: emptyL0Must,
      }),
    ).toBe("Attach evidence or add architecture context to start.");
  });

  it("describeFirstPilotIntakeGap names the shortfall once context has been started", () => {
    expect(
      describeFirstPilotIntakeGap({
        title: qualityTitle,
        brief: "x".repeat(40),
        evidenceFileCount: 0,
        evidenceFileNames: [],
        limitedEvidenceAnalysisAcknowledged: false,
        l0Must: emptyL0Must,
      }),
    ).toBe("Architecture Context needs at least 100 characters (40 so far), or attach evidence instead.");
  });

  it("describeFirstPilotIntakeGap surfaces L0 gaps once title and evidence are ready", () => {
    expect(
      describeFirstPilotIntakeGap({
        title: qualityTitle,
        brief: "",
        evidenceFileCount: 1,
        ...analyzableEvidenceDefaults,
        l0Must: emptyL0Must,
      }),
    ).toMatch(/required clarification/i);
  });

  it("describeFirstPilotIntakeGap stays silent whenever submit is allowed", () => {
    expect(
      describeFirstPilotIntakeGap({
        title: qualityTitle,
        brief: "",
        evidenceFileCount: 1,
        ...analyzableEvidenceDefaults,
        l0Must: completeL0Must,
      }),
    ).toBeNull();
    expect(
      describeFirstPilotIntakeGap({
        title: qualityTitle,
        brief: "x".repeat(120),
        evidenceFileCount: 0,
        evidenceFileNames: [],
        limitedEvidenceAnalysisAcknowledged: false,
        l0Must: completeL0Must,
      }),
    ).toBeNull();
  });

  it("formatFirstPilotIntakeWriteDestination prefers workspace label over id", () => {
    expect(
      formatFirstPilotIntakeWriteDestination({
        displayName: "Contoso Retail",
        tenantId: "contoso-retail",
        workspaceId: "ws-42",
        workspaceLabel: "Retail modernization",
      }),
    ).toBe("This review will be created in Retail modernization (Contoso Retail).");
  });

  it("describeFirstPilotStartBlocker surfaces scope confirmation after intake is ready", () => {
    const readyIntake = {
      title: "#Al-Lucid",
      brief: "",
      evidenceFileCount: 1,
      evidenceFileNames: ["ARCHITECTS_HANDBOOK_202409.docx"],
      limitedEvidenceAnalysisAcknowledged: false,
      l0Must: completeL0Must,
    };

    expect(describeFirstPilotIntakeGap(readyIntake)).toBeNull();
    expect(
      describeFirstPilotStartBlocker({
        intake: readyIntake,
        reviewStandardsConfirmed: true,
        policyPackCloudMismatch: null,
        scopeGateOpen: false,
        briefExceedsMaxLength: false,
        maxBriefLength: 10_000,
      }),
    ).toMatch(/in-scope item/i);
  });
});
