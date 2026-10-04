import { describe, expect, it } from "vitest";

import { formatRemediationFactoryPercentDisplay } from "@/lib/remediation-factory/remediation-factory-percent-format";

describe("formatRemediationFactoryPercentDisplay", () => {
  it("normalizes 0–1 fractions to whole percents", () => {
    expect(formatRemediationFactoryPercentDisplay(0.42)).toBe("42%");
  });

  it("keeps 0–100 values as whole percents", () => {
    expect(formatRemediationFactoryPercentDisplay(87)).toBe("87%");
  });
});
