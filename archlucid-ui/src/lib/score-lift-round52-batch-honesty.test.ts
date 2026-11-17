import { describe, expect, it } from "vitest";

import { formatFirstReviewGuidePrerequisitesCombinedHelper } from "@/lib/architecture/first-review-guide-prerequisites-combined-copy";
import { FIRST_REVIEW_TENANT_REVIEW_EVIDENCE_SEAL_LINE } from "@/lib/architecture/first-review-tenant-review-seal-discipline-copy";
import {
  DECISION_REGISTER_EMPTY_SECURENOW_COLLECTION_HONESTY,
} from "@/lib/decision-register-empty-teaching";
import { GOVERNANCE_APPROVAL_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-approval-empty-not-load-failure-copy";
import { SECURENOW_FINDINGS_HEADER_PARTIAL_CAPTURE_LINE } from "@/lib/governance/findings-header-partial-capture-honesty-copy";
import { STANDARDS_CUT_POINT_FRAMEWORK_THEME_NOT_CONTROL_PASS_LINE } from "@/lib/governance/standards-cut-point-framework-theme-copy";
import { DIAGRAM_RECONCILE_EMPTY_NOT_CLEAN_RESULT_LINE } from "@/lib/infra-evidence/diagram-empty-not-clean-result-copy";
import { DRIFT_WORKBENCH_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/drift-workbench-empty-not-failure-copy";
import { RESOURCE_EXPLORER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-empty-not-failure-copy";
import { WORKSPACE_HEALTH_POINT_IN_TIME_HONESTY_LINE } from "@/lib/insights/workspace-health-point-in-time-honesty-copy";
import {
  PATH_INSPECT_LONG_PATH_ID_OVERFLOW_LINE,
  shouldShowPathInspectLongPathIdHonesty,
} from "@/lib/product-line/path-inspect-long-path-id-honesty-copy";
import { SPONSOR_PATH_DISPOSITION_SAVE_UNCHANGED_LINE } from "@/lib/product-line/sponsor-path-disposition-save-error-honesty-copy";
import { REVIEW_COMMIT_EVIDENCE_BEFORE_SEAL_LINE } from "@/lib/reviews/review-commit-evidence-before-seal-copy";
import { findReportProblemSurfaceById } from "@/lib/report-problem-surfaces";

describe("score-lift round52 batch honesty", () => {
  it("partial capture, workspace health, and decision register", () => {
    expect(SECURENOW_FINDINGS_HEADER_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(WORKSPACE_HEALTH_POINT_IN_TIME_HONESTY_LINE).toContain("last successful");
    expect(DECISION_REGISTER_EMPTY_SECURENOW_COLLECTION_HONESTY).toContain("capture");
  });

  it("empty states and framework theme", () => {
    expect(GOVERNANCE_APPROVAL_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed load");
    expect(STANDARDS_CUT_POINT_FRAMEWORK_THEME_NOT_CONTROL_PASS_LINE).toContain("not evidence");
    expect(RESOURCE_EXPLORER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("no load error");
    expect(DRIFT_WORKBENCH_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(DIAGRAM_RECONCILE_EMPTY_NOT_CLEAN_RESULT_LINE).toContain("does not mean");
  });

  it("first-review combined helper, path id overflow, sponsor save", () => {
    expect(
      formatFirstReviewGuidePrerequisitesCombinedHelper({
        sealLine: FIRST_REVIEW_TENANT_REVIEW_EVIDENCE_SEAL_LINE,
        walkthroughStepTitle: "Start a review",
      }),
    ).toContain("walkthrough");
    expect(shouldShowPathInspectLongPathIdHonesty("a".repeat(49))).toBe(true);
    expect(PATH_INSPECT_LONG_PATH_ID_OVERFLOW_LINE).toContain("wrap");
    expect(SPONSOR_PATH_DISPOSITION_SAVE_UNCHANGED_LINE).toContain("unchanged");
    expect(REVIEW_COMMIT_EVIDENCE_BEFORE_SEAL_LINE).toContain("Finalize");
    expect(findReportProblemSurfaceById("securenow-sponsor-path-disposition-save-failure")).toBeDefined();
  });
});