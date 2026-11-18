import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_NL_FACET_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-nl-facet-filter-empty-not-load-failure-copy";
import { GOVERNANCE_FINDINGS_NL_FACET_FILTER_NO_MATCH_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-findings-nl-facet-filter-no-match-partial-capture-copy";
import { GOVERNANCE_APPROVAL_LIST_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-approval-list-load-failure-partial-capture-copy";
import { REMEDIATION_WORKBENCH_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/remediation-workbench-combined-filter-empty-not-load-failure-copy";
import { REMEDIATION_WORKBENCH_COMBINED_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/remediation-workbench-combined-filter-empty-partial-capture-copy";
import { TERRAFORM_ADVISORY_PLAN_OUTPUT_NOT_APPLY_LINE } from "@/lib/infra-evidence/terraform-advisory-plan-output-not-apply-copy";
import { resolveSecureNowInvestigationEffortResultState } from "@/lib/product-line/securenow-investigation-effort-result-state";

describe("score-lift round76 batch honesty", () => {
  it("findings nl facets, remediation combined filters, approval list load, terraform advisory, investigation effort", () => {
    expect(GOVERNANCE_FINDINGS_NL_FACET_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("loaded");
    expect(GOVERNANCE_FINDINGS_NL_FACET_FILTER_NO_MATCH_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(GOVERNANCE_APPROVAL_LIST_LOAD_FAILURE_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_WORKBENCH_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("status and wave");
    expect(REMEDIATION_WORKBENCH_COMBINED_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(TERRAFORM_ADVISORY_PLAN_OUTPUT_NOT_APPLY_LINE).toContain("apply");
    const invalid = resolveSecureNowInvestigationEffortResultState({
      baselineHours: "2",
      afterHours: "5",
      annualInvestigations: "10",
      hourlyRate: "100",
      annualCost: "1000",
    });
    expect(invalid.kind).toBe("incomplete");
    if (invalid.kind === "incomplete") {
      expect(invalid.incompleteReason).toBe("invalid_after_hours");
    }
  });
});