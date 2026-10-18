import { describe, expect, it } from "vitest";

import {
  formatRemediationPriorityWhenBand,
  REMEDIATION_PRIORITY_WHEN_LATER,
  REMEDIATION_PRIORITY_WHEN_THIS_MONTH,
  REMEDIATION_PRIORITY_WHEN_THIS_WEEK,
} from "@/lib/remediation-priority-when-band";

describe("formatRemediationPriorityWhenBand", () => {
  it("maps rank cutoffs without reading the score", () => {
    expect(formatRemediationPriorityWhenBand(1)).toBe(REMEDIATION_PRIORITY_WHEN_THIS_WEEK);
    expect(formatRemediationPriorityWhenBand(5)).toBe(REMEDIATION_PRIORITY_WHEN_THIS_WEEK);
    expect(formatRemediationPriorityWhenBand(6)).toBe(REMEDIATION_PRIORITY_WHEN_THIS_MONTH);
    expect(formatRemediationPriorityWhenBand(25)).toBe(REMEDIATION_PRIORITY_WHEN_THIS_MONTH);
    expect(formatRemediationPriorityWhenBand(26)).toBe(REMEDIATION_PRIORITY_WHEN_LATER);
  });
});
