import { buyerFindingSeverityDisplayLabel } from "@/lib/buyer/buyer-finding-severity-display";
import { describe, expect, it } from "vitest";

describe("buyerFindingSeverityDisplayLabel", () => {
  it("normalizes PHI showcase finding to High", () => {
    expect(buyerFindingSeverityDisplayLabel("Warning", "sensitive-data-minimization-risk")).toBe("High");
  });

  it("preserves stored warning labels", () => {
    expect(buyerFindingSeverityDisplayLabel("Warning")).toBe("Warning");
    expect(buyerFindingSeverityDisplayLabel("Medium")).toBe("Medium");
  });
});
