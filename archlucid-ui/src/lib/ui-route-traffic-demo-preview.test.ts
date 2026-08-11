import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DEMO_PREVIEW_TRAFFIC_NOTE,
  DEMO_PREVIEW_TRAFFIC_PATH,
  DEMO_PREVIEW_TRAFFIC_ROW_ID,
  DEMO_PREVIEW_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-demo-preview";

describe("ui-route-traffic-demo-preview (DPX)", () => {
  it("tracks Demo preview with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DEMO_PREVIEW_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DEMO_PREVIEW_TRAFFIC_PATH);
    expect(row?.section).toBe(DEMO_PREVIEW_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DEMO_PREVIEW_TRAFFIC_NOTE);
    expect(row?.notes).toContain("DemoPreviewEvidenceOrientationStrip");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
