import { describe, expect, it } from "vitest";

import { ARCHITECTURE_COMPARE_DELTA_COUNTS_TWO_SEALED_FOOTNOTE } from "@/lib/architecture/compare-delta-counts-two-sealed-footnote-copy";
import { DIGEST_SUBSCRIPTIONS_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/digests/digest-subscriptions-empty-not-load-failure-copy";
import { STANDARDS_RULES_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/standards-rules-empty-not-load-failure-copy";
import {
  DIAGRAM_RECONCILE_ZERO_CHANGES_NOT_CLEAN_LINE,
  shouldShowDiagramReconcileZeroChangesHonesty,
} from "@/lib/infra-evidence/diagram-reconcile-zero-changes-not-clean-copy";
import { DRIFT_WORKBENCH_EMPTY_DIFFS_NOT_FAILURE_LINE } from "@/lib/infra-evidence/drift-empty-diffs-not-failure-copy";
import { DRIFT_WORKBENCH_EMPTY_INVENTORY_NOT_FAILURE_LINE } from "@/lib/infra-evidence/drift-empty-inventory-not-failure-copy";
import { formatInfrastructureAskInsufficientEvidenceSnapshotLine } from "@/lib/infra-evidence/infrastructure-ask-insufficient-evidence-snapshot-copy";
import { REMEDIATION_PATTERNS_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/remediation-pattern/remediation-patterns-empty-not-load-failure-copy";
import { findReportProblemSurfaceById } from "@/lib/report-problem-surfaces";

describe("score-lift round53 batch honesty", () => {
  it("drift empties, diagram zero rows, and infrastructure ask snapshot", () => {
    expect(DRIFT_WORKBENCH_EMPTY_DIFFS_NOT_FAILURE_LINE).toContain("not a failed");
    expect(DRIFT_WORKBENCH_EMPTY_INVENTORY_NOT_FAILURE_LINE).toContain("successful load");
    expect(DIAGRAM_RECONCILE_ZERO_CHANGES_NOT_CLEAN_LINE).toContain("does not mean");
    expect(shouldShowDiagramReconcileZeroChangesHonesty(0)).toBe(true);
    expect(shouldShowDiagramReconcileZeroChangesHonesty(1)).toBe(false);
    expect(formatInfrastructureAskInsufficientEvidenceSnapshotLine("snap-1")).toContain("snap-1");
    expect(formatInfrastructureAskInsufficientEvidenceSnapshotLine(null)).toContain("pinned");
  });

  it("compare delta footnote, standards, patterns, digests", () => {
    expect(ARCHITECTURE_COMPARE_DELTA_COUNTS_TWO_SEALED_FOOTNOTE).toContain("two finalized");
    expect(STANDARDS_RULES_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed load");
    expect(REMEDIATION_PATTERNS_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("registry load");
    expect(DIGEST_SUBSCRIPTIONS_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not the same");
  });

  it("report problem surfaces for register and pilot disposition save", () => {
    expect(findReportProblemSurfaceById("governance-decision-register-hard-failure")).toBeDefined();
    expect(findReportProblemSurfaceById("compliance-decision-register-hard-failure")).toBeDefined();
    expect(findReportProblemSurfaceById("securenow-pilot-decision-disposition-save-failure")).toBeDefined();
  });
});