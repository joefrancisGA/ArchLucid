import { describe, expect, it } from "vitest";

import { canAssertScopedAbsence, presentAnalysisCoverage, readAnalysisCoverage } from "./analysis-coverage";

describe("analysis coverage", () => {
  it("fails closed for older and contradictory responses", () => {
    expect(readAnalysisCoverage({ enginesSucceeded: 1 })).toBeNull();
    expect(canAssertScopedAbsence({ state: "complete", freshness: "stale", canAssertAbsence: true })).toBe(false);
    expect(canAssertScopedAbsence({ state: "incomplete", freshness: "historical", canAssertAbsence: true })).toBe(false);
    expect(presentAnalysisCoverage(undefined).label).toBe("Coverage unverified");
  });

  it("labels a historical scoped success and retry exhaustion separately", () => {
    const verified = { state: "complete", freshness: "historical", canAssertAbsence: true };
    expect(canAssertScopedAbsence(verified)).toBe(true);
    expect(presentAnalysisCoverage(verified).label).toBe("Historical coverage complete");
    expect(presentAnalysisCoverage({ state: "failed", recovery: "retry_exhausted" }).label).toBe("Retry budget exhausted");
  });
});
