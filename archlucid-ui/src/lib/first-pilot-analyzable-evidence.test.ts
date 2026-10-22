import { describe, expect, it } from "vitest";

import {
  deriveQuickStartEvidencePresenceFromFileNames,
  describeQuickStartAnalyzableEvidenceGap,
  hasQuickStartAnalyzableEvidenceClass,
  needsQuickStartLimitedEvidenceAcknowledgment,
} from "@/lib/first-pilot-analyzable-evidence";
import { FIRST_PILOT_MIN_BRIEF_CHARS } from "@/lib/first-pilot-intake";

describe("first-pilot-analyzable-evidence (TB-2296)", () => {
  it("does not treat generic images as analyzable evidence classes", () => {
    const presence = deriveQuickStartEvidencePresenceFromFileNames(["photo.png"]);

    expect(presence.hasArchitectureDiagram).toBe(false);
    expect(presence.hasCloudInventory).toBe(false);
    expect(presence.hasArchitectureBrief).toBe(false);
  });

  it("accepts topology-named PDFs as diagram-class evidence", () => {
    expect(
      hasQuickStartAnalyzableEvidenceClass({
        operatorBrief: "",
        evidenceFileNames: ["network-topology.pdf"],
        limitedEvidenceAnalysisAcknowledged: false,
      }),
    ).toBe(true);
  });

  it("accepts operator brief at the minimum length without files", () => {
    expect(
      hasQuickStartAnalyzableEvidenceClass({
        operatorBrief: "x".repeat(FIRST_PILOT_MIN_BRIEF_CHARS),
        evidenceFileNames: [],
        limitedEvidenceAnalysisAcknowledged: false,
      }),
    ).toBe(true);
  });

  it("does not accept image-only uploads without acknowledgment", () => {
    expect(
      hasQuickStartAnalyzableEvidenceClass({
        operatorBrief: "",
        evidenceFileNames: ["photo.png"],
        limitedEvidenceAnalysisAcknowledged: false,
      }),
    ).toBe(false);
    expect(
      needsQuickStartLimitedEvidenceAcknowledgment({
        operatorBrief: "",
        evidenceFileNames: ["photo.png"],
        limitedEvidenceAnalysisAcknowledged: false,
      }),
    ).toBe(true);
  });

  it("accepts limited-evidence acknowledgment for otherwise unanalyzable uploads", () => {
    expect(
      hasQuickStartAnalyzableEvidenceClass({
        operatorBrief: "",
        evidenceFileNames: ["photo.png"],
        limitedEvidenceAnalysisAcknowledged: true,
      }),
    ).toBe(true);
  });

  it("does not accept limited-evidence acknowledgment without attachments or operator brief", () => {
    expect(
      hasQuickStartAnalyzableEvidenceClass({
        operatorBrief: "",
        evidenceFileNames: [],
        limitedEvidenceAnalysisAcknowledged: true,
      }),
    ).toBe(false);
  });

  it("describeQuickStartAnalyzableEvidenceGap names the analyzability requirement", () => {
    expect(
      describeQuickStartAnalyzableEvidenceGap({
        operatorBrief: "",
        evidenceFileNames: ["photo.png"],
        limitedEvidenceAnalysisAcknowledged: false,
      }),
    ).toMatch(/analyzable architecture evidence/i);
  });
});
