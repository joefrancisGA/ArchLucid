import { describe, expect, it } from "vitest";

import {
  formatSecurityEvidencePathConfidenceBandLabel,
  formatSecurityEvidencePathKindLabel,
  formatSecurityEvidencePathRelationshipLabel,
  formatSecurityEvidenceProvenanceKindLabel,
  securityEvidencePathConfidenceBandStatusKind,
} from "@/lib/security-evidence-path-presentation";
import { securityEvidencePathHopNodeName } from "@/lib/security-evidence-path-types";

describe("security-evidence-path-presentation", () => {
  it("formats provenance and confidence band labels in sentence case", () => {
    expect(formatSecurityEvidenceProvenanceKindLabel("ObservedFact")).toBe("Observed fact");
    expect(formatSecurityEvidenceProvenanceKindLabel("AiInference")).toBe("AI inference");
    expect(formatSecurityEvidencePathConfidenceBandLabel("HighlyLikely")).toBe("Highly likely");
    expect(formatSecurityEvidencePathConfidenceBandLabel("InsufficientEvidence")).toBe("Insufficient evidence");
  });

  it("maps path kinds to reader-facing labels and preserves unknown values", () => {
    expect(formatSecurityEvidencePathKindLabel("IntendedReachability")).toBe("Can reach");
    expect(formatSecurityEvidencePathKindLabel("Privilege")).toBe("Privilege");
    expect(formatSecurityEvidencePathKindLabel("CapabilityToFlow")).toBe("May access");
    expect(formatSecurityEvidencePathKindLabel("FutureKind")).toBe("FutureKind");
    expect(formatSecurityEvidencePathKindLabel(null)).toBe("Path kind was not stored.");
    expect(formatSecurityEvidencePathKindLabel("")).toBe("");
  });

  it("maps confidence bands to enterprise status kinds without percentages", () => {
    expect(securityEvidencePathConfidenceBandStatusKind("Confirmed")).toBe("ready");
    expect(securityEvidencePathConfidenceBandStatusKind("Possible")).toBe("needs-attention");
  });

  it("uses an explicit absence label when a relationship is not stored", () => {
    expect(formatSecurityEvidencePathRelationshipLabel("RoleAssignment")).toBe("RoleAssignment");
    expect(formatSecurityEvidencePathRelationshipLabel("")).toBe("Relationship type was not stored");
    expect(formatSecurityEvidencePathRelationshipLabel(null)).toBe("Relationship type was not stored");
  });

  it("leads hop labels with the trailing resource name", () => {
    expect(securityEvidencePathHopNodeName("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/logs")).toBe(
      "logs",
    );
    expect(securityEvidencePathHopNodeName("Internet")).toBe("Internet");
  });
});
