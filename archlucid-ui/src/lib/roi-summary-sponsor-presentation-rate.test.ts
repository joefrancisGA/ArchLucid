import { describe, expect, it } from "vitest";

import { formatRoiSummaryUsdWithRateBasis } from "@/lib/roi-summary-sponsor-presentation";

describe("formatRoiSummaryUsdWithRateBasis", () => {
  it("labels buyer-provided hourly rates", () => {
    const result = formatRoiSummaryUsdWithRateBasis(8, 1200, true, {
      isDefaultRate: false,
    });

    expect(result.display).toBe("$1,200");
    expect(result.rateBasis).toBe("buyer-provided");
    expect(result.rateBasisLabel).toMatch(/Buyer-provided/i);
  });

  it("labels default assumptions when no tenant override exists", () => {
    const result = formatRoiSummaryUsdWithRateBasis(8, 1200, true, {
      isDefaultRate: true,
    });

    expect(result.rateBasis).toBe("default-assumption");
    expect(result.rateBasisLabel).toMatch(/default loaded hourly/i);
  });

  it("never headlines demo-derived dollar estimates", () => {
    const result = formatRoiSummaryUsdWithRateBasis(8, 1200, true, {
      isDefaultRate: true,
      demoDerived: true,
    });

    expect(result.rateBasis).toBe("demo-derived");
    expect(result.rateBasisLabel).toMatch(/Illustrative/i);
  });

  it("returns an em dash when USD is suppressed", () => {
    const result = formatRoiSummaryUsdWithRateBasis(0, 0, false, {
      isDefaultRate: true,
    });

    expect(result.display).toBe("—");
  });
});
