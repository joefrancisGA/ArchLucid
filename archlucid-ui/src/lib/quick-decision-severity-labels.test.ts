import { describe, expect, it } from "vitest";

import {
  compareFindingSeverity,
  hasFindingSeverityAtLeast,
  severityBadgeLabel,
  severityKindFromNumericValue,
} from "./quick-decision-severity-labels";

describe("quick-decision-severity-labels", () => {
  it("keeps a missing severity unclassified instead of treating it as Info", () => {
    expect(severityBadgeLabel(null)).toBe("Severity was not stored");
    expect(severityKindFromNumericValue(null)).toBe("unknown");
    expect(hasFindingSeverityAtLeast(null, 0)).toBe(false);
  });

  it("sorts findings without a stored severity after findings with a known severity", () => {
    expect(compareFindingSeverity(null, 0)).toBe(1);
    expect(compareFindingSeverity(0, null, "ascending")).toBe(-1);
  });
});
