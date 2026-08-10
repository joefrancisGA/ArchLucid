import { describe, expect, it } from "vitest";

import { PROOF_CONFIDENCE_LABELS } from "./proof-confidence-taxonomy";
import { proofConfidenceFieldDetail } from "./trust-evidence-proof-confidence-detail";

describe("proofConfidenceFieldDetail", () => {
  it("returns distinct copy for every canonical proof-confidence label", () => {
    const details = Object.values(PROOF_CONFIDENCE_LABELS).map((label) => proofConfidenceFieldDetail(label));

    expect(details.every((detail) => detail !== null)).toBe(true);
    expect(new Set(details).size).toBe(details.length);
  });

  it("explains an unclassified review without asserting evidence strength", () => {
    expect(proofConfidenceFieldDetail(PROOF_CONFIDENCE_LABELS.unknown)).toMatch(/cannot be asserted/i);
  });

  it("tolerates surrounding whitespace", () => {
    expect(proofConfidenceFieldDetail(` ${PROOF_CONFIDENCE_LABELS["simulator-only"]} `)).toMatch(/rehearsal/i);
  });

  it("returns null for an unknown label", () => {
    expect(proofConfidenceFieldDetail("Not a real label")).toBeNull();
  });
});
