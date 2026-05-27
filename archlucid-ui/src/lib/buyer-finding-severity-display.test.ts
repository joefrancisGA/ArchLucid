import { buyerFindingSeverityDisplayLabel } from "@/lib/buyer-finding-severity-display";
import { describe, expect, it } from "vitest";

describe("buyerFindingSeverityDisplayLabel", () => {
  it("normalizes PHI showcase finding to High", () => {
    expect(buyerFindingSeverityDisplayLabel("Warning", "phi-minimization-risk")).toBe("High");
  });

  it("maps warning labels to High for buyer consistency", () => {
    expect(buyerFindingSeverityDisplayLabel("Warning")).toBe("High");
  });
});
