import { describe, expect, it } from "vitest";

import {
  formatSecurityEvidencePathConfidenceBandLabel,
  formatSecurityEvidenceProvenanceKindLabel,
  securityEvidencePathConfidenceBandStatusKind,
} from "@/lib/security-evidence-path-presentation";

describe("security-evidence-path-presentation", () => {
  it("formats provenance and confidence band labels in sentence case", () => {
    expect(formatSecurityEvidenceProvenanceKindLabel("ObservedFact")).toBe("Observed fact");
    expect(formatSecurityEvidenceProvenanceKindLabel("AiInference")).toBe("AI inference");
    expect(formatSecurityEvidencePathConfidenceBandLabel("HighlyLikely")).toBe("Highly likely");
    expect(formatSecurityEvidencePathConfidenceBandLabel("InsufficientEvidence")).toBe("Insufficient evidence");
  });

  it("maps confidence bands to enterprise status kinds without percentages", () => {
    expect(securityEvidencePathConfidenceBandStatusKind("Confirmed")).toBe("ready");
    expect(securityEvidencePathConfidenceBandStatusKind("Possible")).toBe("needs-attention");
  });
});
