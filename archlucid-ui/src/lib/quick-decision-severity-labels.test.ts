import { describe, expect, it } from "vitest";

import {
  compareFindingSeverity,
  hasFindingSeverityAtLeast,
  humanReviewStatusDisplay,
  severityBadgeLabel,
  severityKindFromNumericValue,
} from "./quick-decision-severity-labels";

describe("quick-decision-severity-labels", () => {
  it("keeps a missing severity unclassified instead of treating it as Info", () => {
    expect(severityBadgeLabel(null)).toBe("Severity label was not stored.");
    expect(severityKindFromNumericValue(null)).toBe("unknown");
    expect(hasFindingSeverityAtLeast(null, 0)).toBe(false);
  });

  it("sorts findings without a stored severity after findings with a known severity", () => {
    expect(compareFindingSeverity(null, 0)).toBe(1);
    expect(compareFindingSeverity(0, null, "ascending")).toBe(-1);
  });

  it("labels severities outside the named bands without inventing Critical/High/Medium/Info", () => {
    expect(severityBadgeLabel(4)).toBe("Severity 4 has no reviewer label.");
    expect(severityBadgeLabel(Number.NaN)).toBe("Severity label was not stored.");
  });

  it("labels stored Low wire values without mapping them to Info (P-10)", () => {
    expect(severityBadgeLabel(-1)).toBe("Stored severity Low has no reviewer label.");
  });

  it("maps contract enum numbers to Error and Warning, not High and Medium (P-01)", () => {
    expect(severityBadgeLabel(2)).toBe("Error");
    expect(severityBadgeLabel(1)).toBe("Warning");
    expect(severityKindFromNumericValue(2)).toBe("error");
    expect(severityKindFromNumericValue(1)).toBe("warning");
  });

  it("labels unknown human review status codes without inventing Approved/Pending", () => {
    expect(humanReviewStatusDisplay(99).label).toContain("was not a recognized stored value");
  });
});
