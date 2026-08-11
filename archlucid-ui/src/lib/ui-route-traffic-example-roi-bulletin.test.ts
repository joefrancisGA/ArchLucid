import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  EXAMPLE_ROI_BULLETIN_TRAFFIC_NOTE,
  EXAMPLE_ROI_BULLETIN_TRAFFIC_PATH,
  EXAMPLE_ROI_BULLETIN_TRAFFIC_ROW_ID,
  EXAMPLE_ROI_BULLETIN_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-example-roi-bulletin";

describe("ui-route-traffic-example-roi-bulletin (EXA)", () => {
  it("tracks example ROI bulletin under Marketing with honest synthetic Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === EXAMPLE_ROI_BULLETIN_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(EXAMPLE_ROI_BULLETIN_TRAFFIC_PATH);
    expect(row?.section).toBe(EXAMPLE_ROI_BULLETIN_TRAFFIC_SECTION);
    expect(row?.notes).toBe(EXAMPLE_ROI_BULLETIN_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ExampleRoiBulletinEvidenceOrientationStrip");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
