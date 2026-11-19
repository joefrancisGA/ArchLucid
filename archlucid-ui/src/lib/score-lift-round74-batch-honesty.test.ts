import { describe, expect, it } from "vitest";

import { REMEDIATION_WORKBENCH_STATUS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/remediation-workbench-status-filter-empty-partial-capture-copy";
import { REMEDIATION_FACTORY_ATTACK_PATH_DIAGRAM_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-attack-path-diagram-filter-empty-partial-capture-copy";
import { REMEDIATION_FACTORY_ATTACK_PATH_REPORT_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-attack-path-report-load-failure-partial-capture-copy";
import { REMEDIATION_FACTORY_SIMULATOR_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-simulator-load-failure-partial-capture-copy";
import { formatAttackPathReportPathChipLabel } from "@/lib/remediation-factory/attack-path-report-path-chip-label";

describe("score-lift round74 batch honesty", () => {
  it("instance status filter, attack path report, simulator, and truncated chips", () => {
    expect(REMEDIATION_WORKBENCH_STATUS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_FACTORY_ATTACK_PATH_REPORT_LOAD_FAILURE_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_FACTORY_ATTACK_PATH_DIAGRAM_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_FACTORY_SIMULATOR_LOAD_FAILURE_PARTIAL_CAPTURE_LINE).toContain("gaps");
    const longPathId = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP";
    expect(formatAttackPathReportPathChipLabel(longPathId).length).toBeLessThan(longPathId.length);
    expect(formatAttackPathReportPathChipLabel(longPathId)).toContain("…");
  });
});