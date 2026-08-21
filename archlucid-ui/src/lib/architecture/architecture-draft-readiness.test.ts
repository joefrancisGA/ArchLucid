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
  "We are designing a structured workflow platform for analysts with authentication, auditable evidence trails, and exportable architecture reviews.";

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
    expect(validateArchitectureReviewReadiness(incomplete, [assertedActor]).blockers).toContain("system-name");
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
      businessOutcome: "Reduce cycle time for architecture reviews.",
      systemName: "",
      structuredBrief: readyStructuredBrief(),
    };

    expect(validateArchitectureReviewReadiness(namedReadyExceptName, [assertedActor]).isValid).toBe(false);
    expect(validateArchitectureReviewReadiness(namedReadyExceptName, [assertedActor]).blockers).toEqual(["system-name"]);
  });

  it("does not block review start when constraints and assumptions are empty", () => {
    const emptyLists = {
      freeTextIntent: readyOverview,
      businessOutcome: "Reduce cycle time for architecture reviews.",
      systemName: "Claims intake",
      structuredBrief: {
        ...emptyArchitectureDraftStructuredBrief(),
        qualityAttribute: "RTO 4 hours",
      },
    };

    const result = validateArchitectureReviewReadiness(emptyLists, [assertedActor]);

    expect(result.isValid).toBe(true);
    expect(result.blockers).not.toContain("constraints");
    expect(result.blockers).not.toContain("assumptions");
  });

  it("does not block review start when constraints and assumptions are unknown sentinels", () => {
    const unknownLists = {
      freeTextIntent: readyOverview,
      businessOutcome: "Reduce cycle time for architecture reviews.",
      systemName: "Claims intake",
      structuredBrief: {
        ...emptyArchitectureDraftStructuredBrief(),
        confirmedConstraints: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL],
        confirmedAssumptions: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL],
        qualityAttribute: "RTO 4 hours",
      },
    };

    const result = validateArchitectureReviewReadiness(unknownLists, [assertedActor]);

    expect(result.isValid).toBe(true);
    expect(result.blockers).not.toContain("constraints");
    expect(result.blockers).not.toContain("assumptions");
  });

  it("blocks review start when only an unknown quality-attribute sentinel is present", () => {
    const unknownQuality = {
      freeTextIntent: readyOverview,
      businessOutcome: "Reduce cycle time for architecture reviews.",
      systemName: "Claims intake",
      structuredBrief: {
        ...emptyArchitectureDraftStructuredBrief(),
        qualityAttribute: ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
      },
    };

    const result = validateArchitectureReviewReadiness(unknownQuality, [assertedActor]);

    expect(result.isValid).toBe(false);
    expect(result.blockers).toEqual(["quality-attributes"]);
  });

  it("allows review start with qualitative-only quality attributes", () => {
    const qualitativeOnly = {
      freeTextIntent: readyOverview,
      businessOutcome: "Reduce cycle time for architecture reviews.",
      systemName: "Claims intake",
      structuredBrief: {
        ...readyStructuredBrief(),
        qualityAttribute: "defense in depth; zero trust",
      },
    };

    const result = validateArchitectureReviewReadiness(qualitativeOnly, [assertedActor]);

    expect(result.isValid).toBe(true);
    expect(result.blockers).not.toContain("quality-attributes");
  });

  it("blocks a legacy-minimum draft on quality attributes, not constraints or assumptions (TB-2282)", () => {
    const legacyMinimumOnly = {
      freeTextIntent: readyOverview,
      businessOutcome: "Reduce cycle time for architecture reviews.",
      systemName: "Claims intake",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };

    const result = validateArchitectureReviewReadiness(legacyMinimumOnly, [assertedActor]);

    expect(result.isValid).toBe(false);
    expect(result.blockers).not.toContain("constraints");
    expect(result.blockers).not.toContain("assumptions");
    expect(result.blockers).toContain("quality-attributes");
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
