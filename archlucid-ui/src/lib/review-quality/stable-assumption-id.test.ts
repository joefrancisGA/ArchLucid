import { describe, expect, it } from "vitest";

import { stableAssumptionIdFromText } from "./stable-assumption-id";

describe("stable-assumption-id", () => {
  it("returns the same id for the same assumption label", () => {
    expect(stableAssumptionIdFromText("RTO is 15 minutes")).toBe(
      stableAssumptionIdFromText("  rto is 15 minutes  "),
    );
  });

  it("returns different ids for different labels", () => {
    expect(stableAssumptionIdFromText("Assumption about cache")).not.toBe(
      stableAssumptionIdFromText("Assumption about auth"),
    );
  });
});
