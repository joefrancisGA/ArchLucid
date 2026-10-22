import { describe, expect, it } from "vitest";

import {
  formatArchitectureRecommendationProvenanceLine,
  isArchitectureRecommendationEvidenceBacked,
} from "@/lib/architecture-intelligence/architecture-recommendation-provenance-presentation";

describe("architecture-recommendation-provenance-presentation (LP-07)", () => {
  it("labels model-proposed recommendations without evidence as not evidence-backed", () => {
    expect(
      isArchitectureRecommendationEvidenceBacked({
        origin: "ModelInferred",
        supportStatus: "Unsupported",
      }),
    ).toBe(false);

    expect(
      formatArchitectureRecommendationProvenanceLine({
        origin: "ModelInferred",
        supportStatus: "Unsupported",
      }),
    ).toBe("Origin: Model proposed · Support: Unsupported");
  });

  it("labels system-proposed heuristic recommendations distinctly", () => {
    expect(
      formatArchitectureRecommendationProvenanceLine({
        origin: "SystemProposed",
        supportStatus: "IndirectlySupported",
      }),
    ).toBe("Origin: System proposed · Support: IndirectlySupported");
  });
});
