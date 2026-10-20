import { describe, expect, it } from "vitest";

import {
  formatRemediationPriorityWhenBand,
  formatRemediationPriorityWhenBandForQueueRow,
  resolveRemediationPriorityQueueRankOrder,
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

describe("resolveRemediationPriorityQueueRankOrder", () => {
  it("prefers stored rank order over the row index", () => {
    expect(resolveRemediationPriorityQueueRankOrder(6, 1)).toBe(6);
  });

  it("falls back to the 1-based row index when rank order is missing", () => {
    expect(resolveRemediationPriorityQueueRankOrder(undefined, 26)).toBe(26);
    expect(formatRemediationPriorityWhenBandForQueueRow(undefined, 26)).toBe(REMEDIATION_PRIORITY_WHEN_LATER);
  });
});
