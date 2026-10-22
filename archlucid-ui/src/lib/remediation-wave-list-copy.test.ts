import { describe, expect, it } from "vitest";

import {
  formatRemediationWaveCapLine,
  formatRemediationWaveMembershipLine,
} from "@/lib/remediation-wave-list-copy";

describe("remediation wave list copy", () => {
  it("separates the member count from the cap", () => {
    expect(formatRemediationWaveMembershipLine("Wave A", 2)).toBe("Wave A: 2 findings in this wave.");
    expect(formatRemediationWaveCapLine(5)).toBe("Cap 5.");
  });
});
