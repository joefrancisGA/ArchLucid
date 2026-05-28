import { describe, expect, it } from "vitest";

import { deriveFindingTrustChip } from "@/components/FindingTrustChip";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function baseFinding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-1",
    title: "Sample",
    recommendation: "Do something.",
    severityValue: 2,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    ...overrides,
  };
}

describe("deriveFindingTrustChip", () => {
  it("marks findings with evidence as evidence-backed", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ evidenceRefCount: 2, confidenceLevel: "High" }),
    );

    expect(chip.kind).toBe("evidence-backed");
    expect(chip.label).toBe("Evidence-backed");
  });

  it("marks zero evidence as citation missing", () => {
    const chip = deriveFindingTrustChip(baseFinding({ evidenceRefCount: 0 }));

    expect(chip.kind).toBe("citation-missing");
    expect(chip.label).toBe("Citation missing");
  });

  it("marks low confidence with evidence as low-confidence", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ evidenceRefCount: 1, confidenceLevel: "Low" }),
    );

    expect(chip.kind).toBe("low-confidence");
    expect(chip.label).toBe("Low confidence");
  });

  it("marks low confidence without evidence as heuristic", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ evidenceRefCount: 0, confidenceLevel: "Low" }),
    );

    expect(chip.kind).toBe("heuristic");
    expect(chip.label).toBe("Heuristic");
  });

  it("treats missing evidence count as citation missing", () => {
    const chip = deriveFindingTrustChip(baseFinding({ evidenceRefCount: null }));

    expect(chip.kind).toBe("citation-missing");
  });

  it("does not invent confidence when evidence exists but confidence is unknown", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ evidenceRefCount: 1, confidenceLevel: null }),
    );

    expect(chip.kind).toBe("evidence-backed");
    expect(chip.title).toContain("At least one evidence reference");
  });
});
