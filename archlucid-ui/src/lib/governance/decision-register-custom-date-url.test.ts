import { describe, expect, it } from "vitest";

import {
  decisionRegisterCustomDateHrefFromSearch,
  parseDecisionRegisterCustomDateFromSearch,
} from "@/lib/governance/decision-register-custom-date-url";

describe("decision register custom date URLs", () => {
  it.each(["2026-13-01", "2026-02-29", "2026-04-31", "0000-01-01"])(
    "ignores the invalid calendar date %s",
    (date) => {
      expect(parseDecisionRegisterCustomDateFromSearch(date)).toBe("");
    },
  );

  it("keeps a valid leap day and drops an invalid bound from the URL", () => {
    expect(parseDecisionRegisterCustomDateFromSearch(" 2024-02-29 ")).toBe("2024-02-29");
    expect(decisionRegisterCustomDateHrefFromSearch("to=2026-13-01", "2024-02-29", "2026-13-01"))
      .toBe("/governance/decision-register?from=2024-02-29");
  });
});
