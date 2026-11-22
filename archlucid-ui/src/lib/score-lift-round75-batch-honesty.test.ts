import { describe, expect, it } from "vitest";

import { GOVERNANCE_APPROVAL_STATUS_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-approval-status-filter-empty-not-load-failure-copy";
import { GOVERNANCE_APPROVAL_STATUS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-approval-status-filter-empty-partial-capture-copy";
import { REMEDIATION_WORKBENCH_WAVE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/remediation-workbench-wave-filter-empty-not-load-failure-copy";
import { REMEDIATION_WORKBENCH_WAVE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/remediation-workbench-wave-filter-empty-partial-capture-copy";
import { formatAttackPathReportPathChipLabel } from "@/lib/remediation-factory/attack-path-report-path-chip-label";

describe("score-lift round75 batch honesty", () => {
  it("approval status filter, wave filter, and ranked path chips", () => {
    expect(GOVERNANCE_APPROVAL_STATUS_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("loaded");
    expect(GOVERNANCE_APPROVAL_STATUS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_WORKBENCH_WAVE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("loaded");
    expect(REMEDIATION_WORKBENCH_WAVE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    const longPathId = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP";
    expect(formatAttackPathReportPathChipLabel(longPathId)).toContain("…");
  });
});