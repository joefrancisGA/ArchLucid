import { describe, expect, it } from "vitest";

import { buyerLabelForQualityGateMode } from "@/lib/quality-gate-mode-buyer-label";
import {
  STRICT_AI_QUALITY_MODE_BUYER_LABEL,
  WARN_ONLY_QUALITY_MODE_BUYER_LABEL,
} from "@/lib/usability/canonical-product-terms";

describe("buyerLabelForQualityGateMode", () => {
  it("maps PilotStrict and WarnOnly wire values", () => {
    expect(buyerLabelForQualityGateMode("PilotStrict")).toBe(STRICT_AI_QUALITY_MODE_BUYER_LABEL);
    expect(buyerLabelForQualityGateMode("WarnOnly")).toBe(WARN_ONLY_QUALITY_MODE_BUYER_LABEL);
  });

  it("handles blank and unknown values", () => {
    expect(buyerLabelForQualityGateMode(null)).toBe("Unknown quality mode");
    expect(buyerLabelForQualityGateMode("")).toBe("Unknown quality mode");
    expect(buyerLabelForQualityGateMode("CustomMode")).toBe("CustomMode");
  });
});
