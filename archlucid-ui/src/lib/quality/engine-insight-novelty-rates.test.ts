import { describe, expect, it } from "vitest";

import { formatEngineInsightNoveltyRatesPresentation } from "./engine-insight-novelty-rates";

describe("engine-insight-novelty-rates (DX-23)", () => {
  it("formats an internal novelty summary line", () => {
    const presentation = formatEngineInsightNoveltyRatesPresentation([
      {
        engineType: "security-baseline",
        decisionGradeCount: 4,
        didNotThinkOfThatCount: 1,
        rate: 0.25,
      },
      {
        engineType: "requirement",
        decisionGradeCount: 2,
        didNotThinkOfThatCount: 1,
        rate: 0.5,
      },
    ]);

    expect(presentation?.line).toBe("Novelty marks: 2 of 6 decision-grade findings (internal).");
  });

  it("returns null when there are no rows", () => {
    expect(formatEngineInsightNoveltyRatesPresentation([])).toBeNull();
  });
});
