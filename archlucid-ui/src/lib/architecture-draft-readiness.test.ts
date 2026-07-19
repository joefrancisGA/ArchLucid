import { describe, expect, it } from "vitest";

import {
  validateArchitectureDraftIntegrity,
  validateArchitectureReviewReadiness,
} from "@/lib/architecture-draft-readiness";

describe("architecture-draft-readiness", () => {
  it("permits incomplete draft saves while blocking review start", () => {
    const incomplete = {
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "",
    };

    expect(validateArchitectureDraftIntegrity(incomplete).isValid).toBe(true);
    expect(validateArchitectureReviewReadiness(incomplete).isValid).toBe(false);
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
});
