import { describe, expect, it } from "vitest";
import { EVIDENCE_GRAPH_NODE_FOCUS_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-node-focus-only-empty-not-load-failure-copy";
import { SYSTEM_HEALTH_SUMMARY_TILE_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE } from "@/lib/administration/system-health-summary-tile-point-in-time-not-load-failure-copy";
import { RUN_DETAIL_DELIVERABLES_SECONDARY_EXPORTS_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/runs/run-detail-deliverables-secondary-exports-finalize-not-load-failure-copy";
import { GOVERNANCE_ASSIGNED_TO_ME_EMPTY_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-assigned-to-me-empty-collection-blocker-not-load-failure-copy";

describe("score-lift round106 batch honesty", () => {
  it("graph node focus, health tile, deliverables secondary, assigned collection blocker", () => {
    expect(EVIDENCE_GRAPH_NODE_FOCUS_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(SYSTEM_HEALTH_SUMMARY_TILE_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(RUN_DETAIL_DELIVERABLES_SECONDARY_EXPORTS_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(GOVERNANCE_ASSIGNED_TO_ME_EMPTY_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
