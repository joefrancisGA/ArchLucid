import { describe, expect, it } from "vitest";

import { resolveRunExplanationFindingCountForHeadline } from "@/lib/runs/run-explanation-headline-stats-display";

describe("resolveRunExplanationFindingCountForHeadline", () => {
  it("does not coerce invalid override into summary count", () => {
    expect(resolveRunExplanationFindingCountForHeadline(Number.NaN, 5)).toBe("Not returned");
  });
});
