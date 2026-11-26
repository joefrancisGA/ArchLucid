import { describe, expect, it } from "vitest";
import { DRIFT_WORKBENCH_EMPTY_DIFFS_NOT_FAILURE_LINE } from "@/lib/infra-evidence/drift-empty-diffs-not-failure-copy";
import { DECISION_REGISTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/decision-register-empty-not-load-failure-copy";
import { GOVERNANCE_APPROVAL_STATUS_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-approval-status-filter-empty-not-load-failure-copy";
import { PACKAGE_CHANGES_SINCE_FINALIZE_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/runs/package-changes-since-finalize-empty-not-load-failure-copy";

describe("score-lift round133 batch honesty", () => {
  it("drift, package changes, decision register, approvals filter", () => {
    expect(DRIFT_WORKBENCH_EMPTY_DIFFS_NOT_FAILURE_LINE).toContain("not a failed");
    expect(PACKAGE_CHANGES_SINCE_FINALIZE_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(DECISION_REGISTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("failed register read");
    expect(GOVERNANCE_APPROVAL_STATUS_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("Approval requests loaded, but this status filter matches none");
  });
});
