import { describe, expect, it } from "vitest";

import {
  formatInsightDensityMeasurementDenominatorLine,
  INSIGHT_DENSITY_BUILT_IN_PRODUCT_ENGINE_COUNT,
  INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT,
} from "./insight-density-measurement-denominator";

describe("insight-density-measurement-denominator (LK-14)", () => {
  it("pins harness and catalog counts to Decisioning constants", () => {
    expect(INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT).toBe(16);
    expect(INSIGHT_DENSITY_BUILT_IN_PRODUCT_ENGINE_COUNT).toBe(39);
  });

  it("formats an honest denominator without claiming unmeasured engines ran", () => {
    const { line, helpHref } = formatInsightDensityMeasurementDenominatorLine();

    expect(line).toContain("no measured engine coverage");
    expect(line).toContain("39 built-in engines");
    expect(line).toContain("16");
    expect(line).not.toContain("career corpus");
    expect(line).not.toMatch(/all engines (were )?scored/i);
    expect(helpHref).toMatch(/^\/help\//);
  });
});
