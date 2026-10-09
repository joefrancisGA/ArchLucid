import { describe, expect, it } from "vitest";

import { createMinimalDemoPreviewPayload } from "@/app/(marketing)/see-it/see-it.fixtures";

import { hasUsableMarketingRunExplanationCounts } from "./demo-preview-run-explanation-counts";

describe("hasUsableMarketingRunExplanationCounts", () => {
  it("rejects non-finite finding counts", () => {
    const payload = createMinimalDemoPreviewPayload();

    expect(
      hasUsableMarketingRunExplanationCounts({
        ...payload.runExplanation!,
        findingCount: Number.NaN,
      }),
    ).toBe(false);
  });

  it("rejects negative finding counts", () => {
    const payload = createMinimalDemoPreviewPayload();

    expect(
      hasUsableMarketingRunExplanationCounts({
        ...payload.runExplanation!,
        findingCount: -1,
      }),
    ).toBe(false);
  });

  it("rejects fractional compliance gap counts", () => {
    const payload = createMinimalDemoPreviewPayload();

    expect(
      hasUsableMarketingRunExplanationCounts({
        ...payload.runExplanation!,
        complianceGapCount: 1.5,
      }),
    ).toBe(false);
  });
});
