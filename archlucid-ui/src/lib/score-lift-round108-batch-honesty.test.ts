import { describe, expect, it } from "vitest";
import { GOVERNANCE_FINDINGS_EMPTY_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-empty-partial-capture-not-load-failure-copy";
import { RUN_DETAIL_ARCHITECTURE_REQUEST_JSON_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/runs/run-detail-architecture-request-json-finalize-not-load-failure-copy";
import { RUN_DETAIL_REVIEW_EXPORT_ZIP_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/runs/run-detail-review-export-zip-finalize-not-load-failure-copy";
import { WORKSPACE_HEALTH_KPI_TILES_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/workspace-health-kpi-tiles-point-in-time-not-load-failure-copy";

describe("score-lift round108 batch honesty", () => {
  it("findings partial capture, request json, review zip, workspace kpi tiles", () => {
    expect(GOVERNANCE_FINDINGS_EMPTY_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RUN_DETAIL_ARCHITECTURE_REQUEST_JSON_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RUN_DETAIL_REVIEW_EXPORT_ZIP_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(WORKSPACE_HEALTH_KPI_TILES_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE).toContain("not");
  });
});
