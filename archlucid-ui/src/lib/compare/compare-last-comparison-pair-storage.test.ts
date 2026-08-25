import { describe, expect, it } from "vitest";

import {
  readCompareLastComparisonPair,
  writeCompareLastComparisonPair,
} from "@/lib/compare/compare-last-comparison-pair-storage";

describe("compare-last-comparison-pair-storage", () => {
  it("round-trips a comparison pair", () => {
    writeCompareLastComparisonPair({ priorRunId: "run-prior", laterRunId: "run-later" });

    expect(readCompareLastComparisonPair()).toEqual({
      priorRunId: "run-prior",
      laterRunId: "run-later",
    });
  });
});
