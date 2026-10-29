import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_INTEGRITY_OUTCOME_NOT_STORED,
  formatArchitectureIntelligenceIntegrityLabel,
  formatArchitectureIntelligenceReasoningConclusion,
  formatArchitectureIntelligenceReasoningSeverity,
} from "@/lib/architecture/architecture-intelligence-reasoning-finding-display";
import {
  ARCHITECTURE_INTELLIGENCE_FINDING_CONCLUSION_NOT_STORED,
  ARCHITECTURE_INTELLIGENCE_FINDING_SEVERITY_NOT_STORED,
} from "@/lib/architecture/architecture-intelligence-findings";

describe("architecture-intelligence-reasoning-finding-display (P-01–P-03)", () => {
  it("labels omitted severity and conclusion without guessing", () => {
    expect(formatArchitectureIntelligenceReasoningSeverity(undefined)).toBe(
      ARCHITECTURE_INTELLIGENCE_FINDING_SEVERITY_NOT_STORED,
    );
    expect(formatArchitectureIntelligenceReasoningSeverity("  ")).toBe(
      ARCHITECTURE_INTELLIGENCE_FINDING_SEVERITY_NOT_STORED,
    );
    expect(formatArchitectureIntelligenceReasoningConclusion("")).toBe(
      ARCHITECTURE_INTELLIGENCE_FINDING_CONCLUSION_NOT_STORED,
    );
  });

  it("labels integrity outcome when id lists and validation are absent (P-02)", () => {
    expect(
      formatArchitectureIntelligenceIntegrityLabel({
        findingId: "f-1",
        integritySet: new Set(),
        validationPassed: undefined,
      }),
    ).toBe(ARCHITECTURE_INTELLIGENCE_INTEGRITY_OUTCOME_NOT_STORED);
  });

  it("does not call a missing integrity id a failure", () => {
    expect(
      formatArchitectureIntelligenceIntegrityLabel({
        findingId: "f-missing",
        integritySet: new Set(["f-other"]),
        validationPassed: undefined,
      }),
    ).toBe("This finding id was not in the integrity-passed list.");
  });

  it("does not infer integrity from validation when finding id is missing", () => {
    expect(
      formatArchitectureIntelligenceIntegrityLabel({
        findingId: "",
        integritySet: new Set(),
        validationPassed: true,
      }),
    ).toBe(ARCHITECTURE_INTELLIGENCE_INTEGRITY_OUTCOME_NOT_STORED);
  });
});
