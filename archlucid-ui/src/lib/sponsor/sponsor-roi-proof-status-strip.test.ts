import { describe, expect, it } from "vitest";

import {
  costEvidenceFreshnessStatusTagKind,
  formatSponsorHeadlineScopeCodeLabel,
} from "@/lib/sponsor/sponsor-roi-proof-status-strip";

describe("costEvidenceFreshnessStatusTagKind", () => {
  it("maps freshness states to enterprise status kinds", () => {
    expect(costEvidenceFreshnessStatusTagKind("fresh")).toBe("ready");
    expect(costEvidenceFreshnessStatusTagKind("stale")).toBe("needs-attention");
    expect(costEvidenceFreshnessStatusTagKind("missing")).toBe("needs-attention");
    expect(costEvidenceFreshnessStatusTagKind("demo-derived")).toBe("in-progress");
  });
});

describe("formatSponsorHeadlineScopeCodeLabel", () => {
  it("returns null for empty scope codes", () => {
    expect(formatSponsorHeadlineScopeCodeLabel(undefined)).toBeNull();
    expect(formatSponsorHeadlineScopeCodeLabel("   ")).toBeNull();
  });

  it("formats non-empty scope codes", () => {
    expect(formatSponsorHeadlineScopeCodeLabel("headline-disposition-aware")).toBe(
      "Headline scope: headline-disposition-aware",
    );
  });
});
