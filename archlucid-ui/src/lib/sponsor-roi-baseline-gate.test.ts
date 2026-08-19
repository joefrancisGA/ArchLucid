import { describe, expect, it } from "vitest";

import {
  resolveSponsorRoiBaselineGate,
  shouldShowSponsorRoiBaselineGateNotice,
  SPONSOR_ROI_BASELINE_SCORECARD_HREF,
} from "@/lib/sponsor-roi-baseline-gate";

describe("sponsor-roi-baseline-gate", () => {
  it("returns not-applicable when the package is not finalized", () => {
    expect(
      resolveSponsorRoiBaselineGate({
        hasBaselines: false,
        isFinalized: false,
      }),
    ).toBe("not-applicable");

    expect(
      resolveSponsorRoiBaselineGate({
        hasBaselines: true,
        isFinalized: false,
      }),
    ).toBe("not-applicable");
  });

  it("returns ready when finalized with baselines", () => {
    expect(
      resolveSponsorRoiBaselineGate({
        hasBaselines: true,
        isFinalized: true,
      }),
    ).toBe("ready");
  });

  it("returns missing-baselines when finalized without baselines", () => {
    expect(
      resolveSponsorRoiBaselineGate({
        hasBaselines: false,
        isFinalized: true,
      }),
    ).toBe("missing-baselines");
  });

  it("only shows the soft notice for missing-baselines", () => {
    expect(shouldShowSponsorRoiBaselineGateNotice("missing-baselines")).toBe(true);
    expect(shouldShowSponsorRoiBaselineGateNotice("ready")).toBe(false);
    expect(shouldShowSponsorRoiBaselineGateNotice("not-applicable")).toBe(false);
  });

  it("points capture CTA at the architecture scorecard ROI assumptions hash", () => {
    expect(SPONSOR_ROI_BASELINE_SCORECARD_HREF).toBe(
      "/insights/architecture-scorecard#roi-assumptions",
    );
  });
});
