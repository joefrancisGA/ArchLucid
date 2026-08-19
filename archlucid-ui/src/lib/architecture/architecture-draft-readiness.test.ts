import { describe, expect, it } from "vitest";

import {
  hasArchitectureDraftSaveableContent,
  validateArchitectureDraftIntegrity,
  validateArchitectureReviewReadiness,
} from "@/lib/architecture/architecture-draft-readiness";
import {
  ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
  emptyArchitectureDraftStructuredBrief,
} from "@/lib/architecture/architecture-draft-structured-brief";
import type { ActorDescriptor } from "@/types/draft-intake";

const assertedActor: ActorDescriptor = {
  label: "Primary operator",
  kind: "Human",
  trustOrigin: "Internal",
  contract: "Sync",
  origin: "Asserted",
  confidence: 100,
};

const readyOverview =
  "We are designing a governed workflow platform for analysts with authentication, auditable evidence trails, and exportable architecture reviews.";

function readyStructuredBrief() {
  return {
    ...emptyArchitectureDraftStructuredBrief(),
    confirmedConstraints: ["Private endpoints required"],
    confirmedAssumptions: ["Team operates in a single region"],
    qualityAttribute: "RTO 4 hours",
  };
}

describe("architecture-draft-readiness", () => {
  it("permits incomplete draft saves while blocking review start", () => {
    const incomplete = {
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    expect(validateArchitectureDraftIntegrity(incomplete).isValid).toBe(true);
    expect(validateArchitectureReviewReadiness(incomplete, [assertedActor]).isValid).toBe(false);
    expect(validateArchitectureReviewReadiness(incomplete, [assertedActor]).blockers).toContain("system name");
  });

  it("blocks draft integrity only when partial fields violate format rules", () => {
    const partialInvalidOutcome = {
      freeTextIntent: "",
      businessOutcome: "tiny",
      systemName: "",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    expect(validateArchitectureDraftIntegrity(partialInvalidOutcome).isValid).toBe(false);
    expect(validateArchitectureReviewReadiness(partialInvalidOutcome, [assertedActor]).isValid).toBe(false);
  });

  it("requires a system name before review start even when overview and outcome are complete", () => {
    const namedReadyExceptName = {
      freeTextIntent: readyOverview,
      businessOutcome: "Reduce cycle time for governed architecture reviews.",
      systemName: "",
      structuredBrief: readyStructuredBrief(),
    };

    expect(validateArchitectureReviewReadiness(namedReadyExceptName, [assertedActor]).isValid).toBe(false);
    expect(validateArchitectureReviewReadiness(namedReadyExceptName, [assertedActor]).blockers).toEqual(["system name"]);
  });

  it("blocks review start when only unknown sentinel placeholders are present (TB-2343)", () => {
    const withUnknownsOnly = {
      freeTextIntent: readyOverview,
      businessOutcome: "Reduce cycle time for governed architecture reviews.",
      systemName: "Claims intake",
      structuredBrief: {
        ...emptyArchitectureDraftStructuredBrief(),
        confirmedConstraints: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL],
        confirmedAssumptions: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL],
        qualityAttribute: ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
      },
    };

    const result = validateArchitectureReviewReadiness(withUnknownsOnly, [assertedActor]);

    expect(result.isValid).toBe(false);
    expect(result.blockers).toContain("constraint");
    expect(result.blockers).toContain("assumption");
    expect(result.blockers).toContain("quality attribute with a numeric target");
  });

  it("allows mixed sentinel and real constraint while still requiring real assumption (TB-2343)", () => {
    const mixed = {
      freeTextIntent: readyOverview,
      businessOutcome: "Reduce cycle time for governed architecture reviews.",
      systemName: "Claims intake",
      structuredBrief: {
        ...emptyArchitectureDraftStructuredBrief(),
        confirmedConstraints: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL, "Private endpoints required"],
        confirmedAssumptions: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL],
        qualityAttribute: "p95 latency 200ms",
      },
    };

    const result = validateArchitectureReviewReadiness(mixed, [assertedActor]);

    expect(result.isValid).toBe(false);
    expect(result.blockers).not.toContain("constraint");
    expect(result.blockers).toContain("assumption");
  });

  it("blocks review start when only legacy name/overview/outcome minimums are met (TB-2282)", () => {
    const legacyMinimumOnly = {
      freeTextIntent: readyOverview,
      businessOutcome: "Reduce cycle time for governed architecture reviews.",
      systemName: "Claims intake",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    const result = validateArchitectureReviewReadiness(legacyMinimumOnly, [assertedActor]);

    expect(result.isValid).toBe(false);
    expect(result.blockers).toContain("constraint");
    expect(result.blockers).toContain("assumption");
    expect(result.blockers).toContain("quality attribute with a numeric target");
  });

  it("gates deferred server create until at least one valid field has content", () => {
    const empty = {
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    expect(hasArchitectureDraftSaveableContent(empty)).toBe(false);

    const systemNameOnly = {
      ...empty,
      systemName: "Claims intake",
    };

    expect(hasArchitectureDraftSaveableContent(systemNameOnly)).toBe(true);

    const partialInvalidOutcome = {
      ...empty,
      businessOutcome: "tiny",
    };

    expect(hasArchitectureDraftSaveableContent(partialInvalidOutcome)).toBe(false);
  });
});
