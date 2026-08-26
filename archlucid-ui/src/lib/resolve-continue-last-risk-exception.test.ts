import { describe, expect, it } from "vitest";

import type { RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";
import { resolveContinueLastRiskException } from "@/lib/resolve-continue-last-risk-exception";

function record(overrides: Partial<RiskExceptionRecord> = {}): RiskExceptionRecord {
  return {
    riskExceptionId: "exc-1",
    findingId: "finding-1",
    ownerUserId: "user-1",
    rationale: "Accepted residual risk",
    expiresAtUtc: "2026-12-01T00:00:00Z",
    status: "Active",
    runId: "run-1",
    ...overrides,
  };
}

describe("resolveContinueLastRiskException", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastRiskException(null)).toBeNull();
    expect(resolveContinueLastRiskException({})).toBeNull();
    expect(resolveContinueLastRiskException("nope")).toBeNull();
    expect(resolveContinueLastRiskException([])).toBeNull();
  });

  it("falls back to the most recently recorded exception when no recent view exists", () => {
    const match = resolveContinueLastRiskException([
      record({ riskExceptionId: "exc-a", findingId: "finding-a" }),
      record({ riskExceptionId: "exc-z", findingId: "finding-z", runId: "run-z" }),
    ]);

    expect(match?.riskExceptionId).toBe("exc-z");
    expect(match?.href).toBe("/architecture/reviews/run-z/findings/finding-z");
  });
});
