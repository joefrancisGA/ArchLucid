import { describe, expect, it } from "vitest";

import {
  costEvidenceFreshnessStatusTagKind,
  formatExecutiveHeadlineScopeCodeLabel,
} from "@/lib/executive/executive-roi-proof-status-strip";

describe("costEvidenceFreshnessStatusTagKind", () => {
  it("maps freshness states to enterprise status kinds", () => {
    expect(costEvidenceFreshnessStatusTagKind("fresh")).toBe("ready");
    expect(costEvidenceFreshnessStatusTagKind("stale")).toBe("needs-attention");
    expect(costEvidenceFreshnessStatusTagKind("missing")).toBe("needs-attention");
    expect(costEvidenceFreshnessStatusTagKind("demo-derived")).toBe("in-progress");
  });
});

describe("formatExecutiveHeadlineScopeCodeLabel", () => {
  it("returns null for empty scope codes", () => {
    expect(formatExecutiveHeadlineScopeCodeLabel(undefined)).toBeNull();
    expect(formatExecutiveHeadlineScopeCodeLabel("   ")).toBeNull();
  });

  it("formats non-empty scope codes", () => {
    expect(formatExecutiveHeadlineScopeCodeLabel("headline-disposition-aware")).toBe(
      "Headline scope: headline-disposition-aware",
    );
  });
});
