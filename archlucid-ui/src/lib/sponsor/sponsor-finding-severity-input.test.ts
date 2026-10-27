import { describe, expect, it } from "vitest";

import { sponsorSeverityInputFromFindingSeverityValue } from "@/lib/sponsor/sponsor-finding-severity-input";

describe("sponsorSeverityInputFromFindingSeverityValue (P-10)", () => {
  it("returns null when severity label was not stored", () => {
    expect(sponsorSeverityInputFromFindingSeverityValue(null)).toBeNull();
  });

  it("returns the badge label when severity is stored", () => {
    expect(sponsorSeverityInputFromFindingSeverityValue(2)).toBe("High");
  });
});
