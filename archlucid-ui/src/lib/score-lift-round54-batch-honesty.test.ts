import { describe, expect, it } from "vitest";

import { formatFirstReviewGuidePrerequisitesCombinedHelper } from "@/lib/architecture/first-review-guide-prerequisites-combined-copy";
import { FIRST_REVIEW_GUIDE_SAMPLE_SPINE_NOT_TENANT_SEAL_LINE } from "@/lib/architecture/first-review-guide-sample-spine-prerequisites-copy";
import { ARCHITECTURE_COMPARE_DELTA_COUNTS_TWO_SEALED_FOOTNOTE } from "@/lib/architecture/compare-delta-counts-two-sealed-footnote-copy";
import { DECISION_REGISTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/decision-register-empty-not-load-failure-copy";
import { STANDARDS_RULES_CATALOG_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/standards-rules-catalog-empty-not-load-failure-copy";
import {
  DIAGRAM_RECONCILE_FILTER_HID_ROWS_LINE,
  shouldShowDiagramReconcileFilterHidRowsHonesty,
} from "@/lib/infra-evidence/diagram-reconcile-filter-hid-rows-copy";
import {
  DRIFT_WORKBENCH_EMPTY_DIFFS_UNCHANGED_FILTER_OFF_LINE,
  shouldShowDriftEmptyDiffsUnchangedFilterOffHonesty,
} from "@/lib/infra-evidence/drift-empty-diffs-unchanged-filter-off-copy";
import { TERRAFORM_ADVISORY_PLAN_OUTPUT_NOT_APPLY_LINE } from "@/lib/infra-evidence/terraform-advisory-plan-output-not-apply-copy";
import { formatPartialCaptureWithSnapshotIdLine } from "@/lib/product-line/partial-capture-snapshot-id-honesty-copy";
import { findReportProblemSurfaceById } from "@/lib/report-problem-surfaces";

describe("score-lift round54 batch honesty", () => {
  it("terraform, drift unchanged filter, diagram filter hid rows", () => {
    expect(TERRAFORM_ADVISORY_PLAN_OUTPUT_NOT_APPLY_LINE).toContain("terraform apply");
    expect(shouldShowDriftEmptyDiffsUnchangedFilterOffHonesty(false)).toBe(true);
    expect(DRIFT_WORKBENCH_EMPTY_DIFFS_UNCHANGED_FILTER_OFF_LINE).toContain("Include unchanged");
    expect(shouldShowDiagramReconcileFilterHidRowsHonesty(3, 0)).toBe(true);
    expect(DIAGRAM_RECONCILE_FILTER_HID_ROWS_LINE).toContain("filter");
  });

  it("catalog empties, compare footnote, first-review sample spine", () => {
    expect(STANDARDS_RULES_CATALOG_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed load");
    expect(DECISION_REGISTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not the same");
    expect(ARCHITECTURE_COMPARE_DELTA_COUNTS_TWO_SEALED_FOOTNOTE).toContain("two finalized");
    expect(
      formatFirstReviewGuidePrerequisitesCombinedHelper({
        sealLine: "Seal line.",
        walkthroughStepTitle: null,
        sampleSpineActive: true,
      }),
    ).toContain(FIRST_REVIEW_GUIDE_SAMPLE_SPINE_NOT_TENANT_SEAL_LINE.slice(0, 20));
  });

  it("partial capture snapshot id and report problem surfaces", () => {
    expect(formatPartialCaptureWithSnapshotIdLine("snap-abc")).toContain("snap-abc");
    expect(findReportProblemSurfaceById("governance-remediation-patterns-hard-failure")).toBeDefined();
    expect(findReportProblemSurfaceById("governance-digest-subscriptions-hard-failure")).toBeDefined();
  });
});