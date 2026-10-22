import { describe, expect, it } from "vitest";

import { formatTrustCenterReviewDate } from "./trust-center-review-date";

describe("formatTrustCenterReviewDate", () => {
  it("omits dateTime when review date is absent", () => {
    const display = formatTrustCenterReviewDate(null);

    expect(display.label).toBe("Updated with each assurance-cycle refresh");
    expect(display.dateTime).toBeNull();
  });

  it("omits dateTime when review date is unparsable", () => {
    const display = formatTrustCenterReviewDate("not-a-date");

    expect(display.label).toBe("not-a-date");
    expect(display.dateTime).toBeNull();
  });

  it("returns ISO dateTime for valid review timestamps", () => {
    const display = formatTrustCenterReviewDate("2026-05-01T12:00:00.000Z");

    expect(display.label).toBe("2026-05-01");
    expect(display.dateTime).toBe("2026-05-01");
  });
});
