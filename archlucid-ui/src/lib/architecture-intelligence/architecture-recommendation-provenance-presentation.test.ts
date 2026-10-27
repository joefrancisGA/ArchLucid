import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_RECOMMENDATION_PROVENANCE_NOT_STORED,
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

describe("architecture-recommendation-provenance-presentation (P-15)", () => {
  it("labels omitted provenance instead of hiding the chip line", () => {
    expect(formatArchitectureRecommendationProvenanceLine(undefined)).toBe(
      ARCHITECTURE_RECOMMENDATION_PROVENANCE_NOT_STORED,
    );
    expect(formatArchitectureRecommendationProvenanceLine({})).toBe(
      ARCHITECTURE_RECOMMENDATION_PROVENANCE_NOT_STORED,
    );
  });
});
