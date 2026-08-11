import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE,
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH,
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID,
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-signed-record-artifact-preview";

describe("ui-route-traffic-signed-record-artifact-preview (TB-1946 / TB-1949 / GAR)", () => {
  it("tracks GAR under Alerts/gov as live signed-record artifact preview SoT for RER redirect", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH);
    expect(row?.section).toBe(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes.toLowerCase()).not.toContain("ghost");
    expect(row?.notes).toContain("TB-1821");
    expect(row?.notes).toContain("RER");
    expect(row?.notes).toContain("SignedRecordArtifactPageView");
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 68");
    expect(rows.find((candidate) => candidate.id === "SIM")).toBeUndefined();
  });
});
