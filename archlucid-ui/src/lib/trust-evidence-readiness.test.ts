import { describe, expect, it } from "vitest";

import {
  deriveTrustEvidenceReadiness,
  isTrustEvidenceFieldException,
  isTrustEvidenceFieldOutOfScope,
  isTrustEvidenceFieldReady,
  trustEvidenceReadinessField,
  type TrustEvidenceReadinessField,
} from "./trust-evidence-readiness";

function readinessField(
  key: string,
  status: string,
  detail: string | null = null,
): TrustEvidenceReadinessField {
  return { key, title: `${key} title`, status, detail };
}

describe("trust evidence field status predicates", () => {
  it("treats Available as ready", () => {
    expect(isTrustEvidenceFieldReady("Available")).toBe(true);
    expect(isTrustEvidenceFieldReady(" available ")).toBe(true);
    expect(isTrustEvidenceFieldReady("Missing")).toBe(false);
  });

  it("treats Not applicable as out of scope rather than a gap", () => {
    expect(isTrustEvidenceFieldOutOfScope("Not applicable")).toBe(true);
    expect(isTrustEvidenceFieldException("Not applicable")).toBe(false);
  });

  it("treats every other status as an exception needing attention", () => {
    expect(isTrustEvidenceFieldException("Missing")).toBe(true);
    expect(isTrustEvidenceFieldException("Low confidence")).toBe(true);
    expect(isTrustEvidenceFieldException("Demo-only")).toBe(true);
    expect(isTrustEvidenceFieldException("Evidence not classified")).toBe(true);
    expect(isTrustEvidenceFieldException("Available")).toBe(false);
  });
});

describe("deriveTrustEvidenceReadiness", () => {
  it("reports a complete verdict when nothing needs attention", () => {
    const readiness = deriveTrustEvidenceReadiness([
      readinessField("a", "Available"),
      readinessField("b", "Not applicable"),
    ]);

    expect(readiness.verdict).toBe("complete");
    expect(readiness.headline).toBe("Evidence is ready to share with leadership.");
    expect(readiness.readyCount).toBe(1);
    expect(readiness.totalCount).toBe(2);
    expect(readiness.exceptions).toHaveLength(0);
    expect(readiness.satisfied).toHaveLength(2);
  });

  it("surfaces exceptions and pluralizes the headline", () => {
    const readiness = deriveTrustEvidenceReadiness([
      readinessField("a", "Available"),
      readinessField("b", "Low confidence"),
      readinessField("c", "Missing"),
    ]);

    expect(readiness.verdict).toBe("gaps");
    expect(readiness.headline).toBe("2 evidence fields need attention before sharing with leadership.");
    expect(readiness.exceptions.map((field) => field.key)).toEqual(["b", "c"]);
    expect(readiness.satisfied.map((field) => field.key)).toEqual(["a"]);
  });

  it("uses singular wording for one exception", () => {
    const readiness = deriveTrustEvidenceReadiness([
      readinessField("a", "Available"),
      readinessField("b", "Missing"),
    ]);

    expect(readiness.headline).toBe("1 evidence field needs attention before sharing with leadership.");
  });

  it("handles an empty field list as complete", () => {
    const readiness = deriveTrustEvidenceReadiness([]);

    expect(readiness.verdict).toBe("complete");
    expect(readiness.totalCount).toBe(0);
  });
});

describe("trustEvidenceReadinessField", () => {
  it("adapts an authority field snapshot and normalizes a missing detail to null", () => {
    expect(trustEvidenceReadinessField("audit", "Audit trail", { title: "Audit trail", status: "Available" })).toEqual({
      key: "audit",
      title: "Audit trail",
      status: "Available",
      detail: null,
    });
  });
});
