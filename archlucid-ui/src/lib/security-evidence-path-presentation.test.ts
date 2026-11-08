import { describe, expect, it } from "vitest";

import {
  explainSecurityEvidenceProvenanceKind,
  formatSecurityEvidencePathConfidenceBandLabel,
  formatSecurityEvidencePathKindLabel,
  formatSecurityEvidencePathRelationshipLabel,
  formatSecurityEvidenceProvenanceKindLabel,
  securityEvidencePathConfidenceBandStatusKind,
} from "@/lib/security-evidence-path-presentation";
import { securityEvidencePathHopNodeName } from "@/lib/security-evidence-path-types";

describe("security-evidence-path-presentation", () => {
  it("formats provenance and confidence band labels in sentence case", () => {
    expect(formatSecurityEvidenceProvenanceKindLabel("ObservedFact")).toBe(
      "Read from collected evidence. Not observed traffic by itself.",
    );
    expect(formatSecurityEvidenceProvenanceKindLabel("AiInference")).toBe("AI inference");
    expect(formatSecurityEvidencePathConfidenceBandLabel("HighlyLikely")).toBe(
      "Stored band: Highly likely. Not a probability and not observed traffic.",
    );
    expect(formatSecurityEvidencePathConfidenceBandLabel("Confirmed")).toBe(
      "Stored band: Confirmed. Not observed traffic.",
    );
    expect(formatSecurityEvidencePathConfidenceBandLabel("InsufficientEvidence")).toBe("Insufficient evidence");
    expect(formatSecurityEvidenceProvenanceKindLabel("")).toBe("Provenance kind was stored empty.");
    expect(formatSecurityEvidencePathConfidenceBandLabel("")).toBe("Confidence band was stored empty.");
    expect(formatSecurityEvidencePathConfidenceBandLabel("UnknownBand")).toBe(
      "Confidence band was not recognized.",
    );
    expect(formatSecurityEvidenceProvenanceKindLabel("UnknownKind")).toBe(
      "Provenance kind was not recognized.",
    );
  });

  it("labels missing band and provenance honestly (P-13, P-14)", () => {
    expect(formatSecurityEvidencePathConfidenceBandLabel(null)).toBe("Confidence band was not stored.");
    expect(formatSecurityEvidenceProvenanceKindLabel(null)).toBe("Provenance kind was not stored.");
    expect(formatSecurityEvidencePathConfidenceBandLabel("")).toBe("Confidence band was stored empty.");
    expect(formatSecurityEvidenceProvenanceKindLabel("")).toBe("Provenance kind was stored empty.");
  });

  it("maps path kinds to reader-facing labels and preserves unknown values", () => {
    expect(formatSecurityEvidencePathKindLabel("IntendedReachability")).toBe(
      "Intended reachability. Observed reachability was not stored.",
    );
    expect(formatSecurityEvidencePathKindLabel("Privilege")).toBe("Privilege");
    expect(formatSecurityEvidencePathKindLabel("CapabilityToFlow")).toBe(
      "May access. Observed use was not stored.",
    );
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
    expect(formatSecurityEvidencePathRelationshipLabel("UnrestrictedEgress")).toBe(
      "Declared NSG allow. Observed egress was not stored.",
    );
    expect(formatSecurityEvidencePathRelationshipLabel("InsufficientEvidenceEgress")).toBe(
      "Egress was not stored as verified. This is not a partial pass.",
    );
    expect(formatSecurityEvidencePathRelationshipLabel("SharedControlFanOut")).toBe(
      "Shared control fan-out. This line is not one observed path.",
    );
  });

  it("explains derived and observed provenance without overstating observation", () => {
    expect(explainSecurityEvidenceProvenanceKind("DerivedFact")).toBe(
      "This hop was calculated from collected evidence. It is not a separately observed hop.",
    );
  });

  it("uses an explicit absence label when a relationship is not stored", () => {
    expect(formatSecurityEvidencePathRelationshipLabel("RoleAssignment")).toBe(
      "Relationship type RoleAssignment has no reviewer label.",
    );
    expect(formatSecurityEvidencePathRelationshipLabel("CAN_READ")).toBe(
      "Role allows read. This is not observed use.",
    );
    expect(formatSecurityEvidencePathRelationshipLabel("")).toBe("Relationship type was stored empty.");
    expect(formatSecurityEvidencePathRelationshipLabel(null)).toBe("Relationship type was not stored");
  });

  it("leads hop labels with the trailing resource name", () => {
    expect(securityEvidencePathHopNodeName("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/logs")).toBe(
      "logs",
    );
    expect(securityEvidencePathHopNodeName("Internet")).toBe("Internet");
    expect(securityEvidencePathHopNodeName("")).toBe("Node name was stored empty.");
  });
});
