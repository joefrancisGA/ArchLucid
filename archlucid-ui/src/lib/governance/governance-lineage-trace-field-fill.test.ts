import { describe, expect, it } from "vitest";

import { formatGovernanceLineageTraceFieldFill } from "@/lib/governance/governance-lineage-trace-field-fill";

describe("formatGovernanceLineageTraceFieldFill", () => {
  it("uses trace field-fill semantics for missing ratios", () => {
    expect(formatGovernanceLineageTraceFieldFill(null)).toContain("Not recorded");
  });

  it("includes percent when ratio is recorded", () => {
    expect(formatGovernanceLineageTraceFieldFill(0.5)).toContain("Trace field fill 50%");
  });
});
