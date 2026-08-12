import { describe, expect, it } from "vitest";

import {
  formatGovernanceLineageCompletenessPercent,
  formatGovernanceLineageWholeCount,
} from "./governance-lineage-metric-format";

describe("formatGovernanceLineageWholeCount", () => {
  it("formats finite numbers with rounding", () => {
    expect(formatGovernanceLineageWholeCount(3)).toBe("3");
    expect(formatGovernanceLineageWholeCount(3.6)).toBe("4");
  });

  it("returns em dash for unusable inputs", () => {
    expect(formatGovernanceLineageWholeCount(NaN)).toBe("—");
    expect(formatGovernanceLineageWholeCount(Number.POSITIVE_INFINITY)).toBe("—");
    expect(formatGovernanceLineageWholeCount("42")).toBe("—");
    expect(formatGovernanceLineageWholeCount(null)).toBe("—");
    expect(formatGovernanceLineageWholeCount(undefined)).toBe("—");
  });
});

describe("formatGovernanceLineageCompletenessPercent", () => {
  it("formats ratio to whole percent", () => {
    expect(formatGovernanceLineageCompletenessPercent(0.42)).toBe("42%");
  });

  it("returns em dash for unusable inputs", () => {
    expect(formatGovernanceLineageCompletenessPercent(NaN)).toBe("—");
    expect(formatGovernanceLineageCompletenessPercent(null)).toBe("—");
  });
});
