import { describe, expect, it } from "vitest";
import { EXTRACT_UPLOAD_EVALUATION_PENDING_NOT_LOAD_FAILURE_LINE } from "@/lib/extract-upload/extract-upload-evaluation-pending-not-load-failure-copy";
import { SYSTEM_HEALTH_SUMMARY_TILE_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE } from "@/lib/administration/system-health-summary-tile-point-in-time-not-load-failure-copy";
import { WORKSPACE_HEALTH_KPI_CARD_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/workspace-health-kpi-card-point-in-time-not-load-failure-copy";

describe("score-lift round130 batch honesty", () => {
  it("upload pending and health point-in-time", () => {
    expect(EXTRACT_UPLOAD_EVALUATION_PENDING_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(SYSTEM_HEALTH_SUMMARY_TILE_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE).toContain("refresh");
    expect(WORKSPACE_HEALTH_KPI_CARD_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(WORKSPACE_HEALTH_KPI_CARD_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE).toContain("Refresh");
  });
});
