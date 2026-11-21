import { describe, expect, it } from "vitest";
import { CONNECTION_STATUS_DASHBOARD_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/integrations/connection-status-dashboard-partial-capture-copy";
import { RUN_DETAIL_FINDINGS_HEADER_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/findings/run-detail-findings-header-partial-capture-copy";
import { EVIDENCE_GRAPH_TYPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-type-filter-empty-not-load-failure-copy";
import { REMEDIATION_FACTORY_ATTACK_PATH_TABLE_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/remediation-factory/remediation-factory-attack-path-table-partial-capture-not-load-failure-copy";

describe("score-lift round104 batch honesty", () => {
  it("connection partial, run findings header, graph filter, attack path table", () => {
    expect(CONNECTION_STATUS_DASHBOARD_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RUN_DETAIL_FINDINGS_HEADER_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(EVIDENCE_GRAPH_TYPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(REMEDIATION_FACTORY_ATTACK_PATH_TABLE_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
