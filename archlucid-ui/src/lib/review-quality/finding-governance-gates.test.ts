import { describe, expect, it } from "vitest";

import {
  dispositionRequiresRationale,
  dispositionRequiresTradeOffAcknowledgment,
  isDispositionRationaleSatisfied,
  isRecommendationActionable,
  proposedChangeOverridesApprovedDecision,
} from "@/lib/review-quality/finding-governance-gates";

describe("finding-governance-gates", () => {
  it("requires rationale for accept and reject-as-N/A", () => {
    expect(dispositionRequiresRationale("Accepted")).toBe(true);
    expect(dispositionRequiresRationale("RejectedAsNotApplicable")).toBe(true);
    expect(dispositionRequiresRationale("Deferred")).toBe(false);
  });

  it("requires minimum rationale length", () => {
    expect(isDispositionRationaleSatisfied("short")).toBe(false);
    expect(isDispositionRationaleSatisfied("Accepted residual latency risk for pilot window.")).toBe(true);
  });

  it("rejects one-line recommendations without structure", () => {
    expect(isRecommendationActionable("Add caching", [])).toBe(false);
    expect(
      isRecommendationActionable(
        "Add read replicas because RTO requires faster recovery; validate with failover test.",
        ["Keep single writer"],
      ),
    ).toBe(true);
  });

  it("flags proposals that mention approved decisions", () => {
    expect(
      proposedChangeOverridesApprovedDecision("Revert the approved API gateway decision", [
        "API gateway decision",
      ]),
    ).toBe("API gateway decision");
  });

  it("requires trade-off acknowledgment on accept", () => {
    expect(dispositionRequiresTradeOffAcknowledgment("Accepted")).toBe(true);
    expect(dispositionRequiresTradeOffAcknowledgment("Remediated")).toBe(false);
  });
});
