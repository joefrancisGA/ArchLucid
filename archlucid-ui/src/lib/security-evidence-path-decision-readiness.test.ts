import { describe, expect, it } from "vitest";
import { buildPathDecisionReadiness } from "@/lib/security-evidence-path-decision-readiness";
import type { SecurityEvidencePathDetail, SecurityEvidencePathRankDetail } from "@/lib/security-evidence-path-types";

const path = {
  pathId: "p1", snapshotId: "s1", hops: [
    { provenanceKind: "ObservedFact", evidenceReference: "", cloudResourceId: "asset-1" },
  ], relatedCutPoints: [],
} as SecurityEvidencePathDetail;

describe("path decision readiness", () => {
  it("flags missing evidence and a rank from another snapshot", () => {
    const result = buildPathDecisionReadiness(path,
      { pathId: "p1", snapshotId: "s2" } as SecurityEvidencePathRankDetail, null);
    expect(result.status).toBe("VERIFY_EVIDENCE");
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.stringContaining("source evidence reference"),
      expect.stringContaining("different path or snapshot"),
    ]));
    expect(result.affectedAssetIds).toEqual(["asset-1"]);
  });
});
