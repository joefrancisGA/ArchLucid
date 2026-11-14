import { describe, expect, it } from "vitest";

import {
  SECURENOW_FINDINGS_OPEN_GATE_PRIMARY_LABEL,
} from "@/lib/product-line/securenow-findings-queue-open-gate-strip-copy";
import { resolveSecureNowCollectionBlockerKindLine } from "@/lib/product-line/securenow-collection-blocker-kind-copy";
import { SECURENOW_ARCHITECT_METRICS_SINGLE_SNAPSHOT_COMPARE_LINE } from "@/lib/product-line/securenow-architect-metrics-single-snapshot-copy";
import { SECURENOW_POLICY_PACK_ASSIGN_RANK_HONESTY_LINE } from "@/lib/product-line/securenow-policy-pack-assign-rank-honesty-copy";
import {
  STANDARDS_RULES_DOES_NOT_SCORE_CONTROLS,
} from "@/lib/standards-rules-evidence-copy";
import { secureNowPathInspectHopEvidenceReferenceCopyValue } from "@/lib/product-line/securenow-hop-evidence-reference-copy";
import {
  findReportProblemSurfaceById,
  REPORT_PROBLEM_V1_SURFACES,
} from "@/lib/report-problem-surfaces";

describe("score-lift round43 batch honesty", () => {
  it("findings open gate strip labels and collection blocker kinds", () => {
    expect(SECURENOW_FINDINGS_OPEN_GATE_PRIMARY_LABEL).toContain("Primary");
    expect(resolveSecureNowCollectionBlockerKindLine("provider")).toContain("Reader");
    expect(resolveSecureNowCollectionBlockerKindLine("subscription")).toContain("subscription");
  });

  it("architect compare, policy pack rank, and standards scoring discipline", () => {
    expect(SECURENOW_ARCHITECT_METRICS_SINGLE_SNAPSHOT_COMPARE_LINE).toContain("second successful capture");
    expect(SECURENOW_POLICY_PACK_ASSIGN_RANK_HONESTY_LINE).toContain("does not change path rank");
    expect(STANDARDS_RULES_DOES_NOT_SCORE_CONTROLS).toContain("does not score");
  });

  it("hop evidence copy helper and remediation factory report-problem surfaces", () => {
    expect(secureNowPathInspectHopEvidenceReferenceCopyValue(" evidence:hop-1 ")).toBe("evidence:hop-1");
    expect(findReportProblemSurfaceById("compliance-remediation-factory-hard-failure")).toBeDefined();
    expect(REPORT_PROBLEM_V1_SURFACES.some((surface) => surface.id === "governance-remediation-factory-hard-failure")).toBe(
      true,
    );
  });
});