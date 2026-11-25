import { describe, expect, it } from "vitest";

import { formatRemediationFactoryPercentDisplay } from "@/lib/remediation-factory/remediation-factory-percent-format";

describe("formatRemediationFactoryPercentDisplay", () => {
  it("normalizes 0–1 fractions to whole percents", () => {
    expect(formatRemediationFactoryPercentDisplay(0.42)).toBe("42%");
  });

  it("treats unity fraction as one hundred percent", () => {
    expect(formatRemediationFactoryPercentDisplay(1)).toBe("100%");
    expect(formatRemediationFactoryPercentDisplay(1.0)).toBe("100%");
  });

  it("rounds sub-point percent fractions after normalization", () => {
    expect(formatRemediationFactoryPercentDisplay(0.426)).toBe("43%");
    expect(formatRemediationFactoryPercentDisplay(42.6)).toBe("43%");
  });

  it("renders zero percent as 0%", () => {
    expect(formatRemediationFactoryPercentDisplay(0)).toBe("0%");
  });

  it("keeps one hundred on the API points scale distinct from a unity fraction", () => {
    expect(formatRemediationFactoryPercentDisplay(100)).toBe("100%");
    expect(formatRemediationFactoryPercentDisplay(1.01)).toBe("1%");
  });

  it("keeps fractional API points above unity on the points scale", () => {
    expect(formatRemediationFactoryPercentDisplay(1.5)).toBe("2%");
  });

  it("keeps 0–100 values as whole percents", () => {
    expect(formatRemediationFactoryPercentDisplay(87)).toBe("87%");
  });
});
