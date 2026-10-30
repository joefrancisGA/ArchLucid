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
    expect(formatSecurityEvidenceProvenanceKindLabel("")).toBe("Provenance kind was not stored.");
    expect(formatSecurityEvidencePathConfidenceBandLabel("")).toBe("Confidence band was not stored.");
    expect(formatSecurityEvidencePathConfidenceBandLabel("UnknownBand")).toBe(
      "Confidence band was not recognized.",
    );
    expect(formatSecurityEvidenceProvenanceKindLabel("UnknownKind")).toBe(
      "Provenance kind was not recognized.",
    );
  });

  it("labels missing band and provenance honestly (P-13, P-14)", () => {
    expect(formatSecurityEvidencePathConfidenceBandLabel("")).toBe("Confidence band was not stored.");
    expect(formatSecurityEvidencePathConfidenceBandLabel(null)).toBe("Confidence band was not stored.");
    expect(formatSecurityEvidenceProvenanceKindLabel("")).toBe("Provenance kind was not stored.");
    expect(formatSecurityEvidenceProvenanceKindLabel(null)).toBe("Provenance kind was not stored.");
  });

  it("maps path kinds to reader-facing labels and preserves unknown values", () => {
    expect(formatSecurityEvidencePathKindLabel("IntendedReachability")).toBe("Intended reachability");
    expect(formatSecurityEvidencePathKindLabel("Privilege")).toBe("Privilege");
    expect(formatSecurityEvidencePathKindLabel("CapabilityToFlow")).toBe("May access");
    expect(formatSecurityEvidencePathKindLabel("FutureKind")).toBe("Path kind was not recognized.");
    expect(formatSecurityEvidencePathKindLabel(null)).toBe("Path kind was not stored.");
    expect(formatSecurityEvidencePathKindLabel("")).toBe("Path kind was stored empty.");
  });

  it("maps confidence bands to enterprise status kinds without percentages", () => {
    expect(securityEvidencePathConfidenceBandStatusKind("Confirmed")).toBe("ready");
    expect(securityEvidencePathConfidenceBandStatusKind("Possible")).toBe("needs-attention");
  });

  it("maps hop relationship labels with configured-not-observed honesty", () => {
    expect(formatSecurityEvidencePathRelationshipLabel("USES_IDENTITY")).toBe(
      "Identity is assigned. Use of that identity was not stored.",
    );
    expect(formatSecurityEvidencePathRelationshipLabel("MEMBER_OF")).toBe(
      "Group membership was stored. Observed use of that membership was not stored.",
    );
    expect(formatSecurityEvidencePathRelationshipLabel("PossibleMovement")).toBe(
      "Possible movement. An observed move was not stored.",
    );
  });

  it("uses an explicit absence label when a relationship is not stored", () => {
    expect(formatSecurityEvidencePathRelationshipLabel("RoleAssignment")).toBe(
      "Relationship type RoleAssignment has no reviewer label.",
    );
    expect(formatSecurityEvidencePathRelationshipLabel("CAN_READ")).toBe(
      "Role allows read. This is not observed use.",
    );
    expect(formatSecurityEvidencePathRelationshipLabel("")).toBe("Relationship type was not stored");
    expect(formatSecurityEvidencePathRelationshipLabel(null)).toBe("Relationship type was not stored");
  });

  it("leads hop labels with the trailing resource name", () => {
    expect(securityEvidencePathHopNodeName("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/logs")).toBe(
      "logs",
    );
    expect(securityEvidencePathHopNodeName("Internet")).toBe("Internet");
    expect(securityEvidencePathHopNodeName("")).toBe("Node name was not stored.");
  });
});
