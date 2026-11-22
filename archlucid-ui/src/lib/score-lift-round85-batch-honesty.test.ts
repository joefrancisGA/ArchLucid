import { describe, expect, it } from "vitest";

import { COMPARE_RUN_PICKERS_CORRELATION_EMPTY_AND_SEAL_LINE } from "@/lib/architecture/compare-run-pickers-correlation-empty-and-seal-copy";
import { COMPARE_RUN_PICKERS_SECOND_REVIEW_NOT_SEALED_LINE } from "@/lib/architecture/compare-run-pickers-second-review-not-sealed-copy";
import { GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_AND_SEVERITY_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-architecture-scope-and-severity-combined-filter-empty-not-load-failure-copy";
import { RESOURCE_HUB_FINDINGS_OPERATIONAL_SECURITY_STREAM_EMPTY_LINE } from "@/lib/infra-evidence/resource-hub-findings-operational-security-stream-empty-copy";
import { RUN_DETAIL_DELIVERABLES_BLOCKED_EXPORT_FINALIZE_AND_PARTIAL_CAPTURE_LINE } from "@/lib/runs/run-detail-deliverables-blocked-export-finalize-and-partial-capture-copy";

describe("score-lift round85 batch honesty", () => {
  it("compare pickers, deliverables blocked buttons, operational stream, findings scope and severity", () => {
    expect(COMPARE_RUN_PICKERS_SECOND_REVIEW_NOT_SEALED_LINE).toContain("sealed");
    expect(COMPARE_RUN_PICKERS_CORRELATION_EMPTY_AND_SEAL_LINE).toContain("correlation");
    expect(RUN_DETAIL_DELIVERABLES_BLOCKED_EXPORT_FINALIZE_AND_PARTIAL_CAPTURE_LINE).toContain("finalized");
    expect(RESOURCE_HUB_FINDINGS_OPERATIONAL_SECURITY_STREAM_EMPTY_LINE).toContain("operational");
    expect(GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_AND_SEVERITY_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("severity");
  });
});
