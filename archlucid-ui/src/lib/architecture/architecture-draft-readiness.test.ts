import { describe, expect, it } from "vitest";

import {
  hasArchitectureDraftSaveableContent,
  validateArchitectureDraftIntegrity,
  validateArchitectureReviewReadiness,
} from "@/lib/architecture/architecture-draft-readiness";

describe("architecture-draft-readiness", () => {
  it("permits incomplete draft saves while blocking review start", () => {
    const incomplete = {
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "",
    };

    expect(validateArchitectureDraftIntegrity(incomplete).isValid).toBe(true);
    expect(validateArchitectureReviewReadiness(incomplete).isValid).toBe(false);
    expect(validateArchitectureReviewReadiness(incomplete).blockers).toContain("system name");
  });

  it("blocks draft integrity only when partial fields violate format rules", () => {
    const partialInvalidOutcome = {
      freeTextIntent: "",
      businessOutcome: "tiny",
      systemName: "",
    };

    expect(validateArchitectureDraftIntegrity(partialInvalidOutcome).isValid).toBe(false);
    expect(validateArchitectureReviewReadiness(partialInvalidOutcome).isValid).toBe(false);
  });

  it("requires a system name before review start even when overview and outcome are complete", () => {
    const namedReadyExceptName = {
      freeTextIntent:
        "We are designing a governed workflow platform for analysts with authentication, auditable evidence trails, and exportable architecture reviews.",
      businessOutcome: "Reduce cycle time for governed architecture reviews.",
      systemName: "",
    };

    expect(validateArchitectureReviewReadiness(namedReadyExceptName).isValid).toBe(false);
    expect(validateArchitectureReviewReadiness(namedReadyExceptName).blockers).toEqual(["system name"]);
  });

  it("gates deferred server create until at least one valid field has content", () => {
    const empty = {
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "",
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
