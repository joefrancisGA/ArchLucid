import { buyerFindingSeverityDisplayLabel } from "@/lib/buyer/buyer-finding-severity-display";
import { describe, expect, it } from "vitest";

describe("buyerFindingSeverityDisplayLabel", () => {
  it("labels missing severity without pending or showcase override", () => {
    expect(buyerFindingSeverityDisplayLabel(null)).toBe("Severity was not stored.");
    expect(buyerFindingSeverityDisplayLabel("   ", "sensitive-data-minimization-risk")).toBe(
      "Severity was not stored.",
    );
  });

  it("preserves stored warning labels", () => {
    expect(buyerFindingSeverityDisplayLabel("Warning")).toBe("Warning");
    expect(buyerFindingSeverityDisplayLabel("Medium")).toBe("Medium");
  });

  it("does not treat Unknown as a stored severity band", () => {
    expect(buyerFindingSeverityDisplayLabel("Unknown")).toBe(
      "Severity label was not a recognized stored value.",
    );
  });
});
