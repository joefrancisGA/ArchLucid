import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ROI_SUMMARY_TRAFFIC_NOTE,
  ROI_SUMMARY_TRAFFIC_PATH,
  ROI_SUMMARY_TRAFFIC_ROW_ID,
  ROI_SUMMARY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-roi-summary";

describe("ui-route-traffic-roi-summary (TB-1971)", () => {
  it("tracks SPR with former VRX hit share and no VRX row", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const spr = rows.find((candidate) => candidate.id === ROI_SUMMARY_TRAFFIC_ROW_ID);
    const vrx = rows.find((candidate) => candidate.id === "VRX");

    expect(vrx).toBeUndefined();
    expect(spr).toBeDefined();
    expect(spr?.path).toBe(ROI_SUMMARY_TRAFFIC_PATH);
    expect(spr?.hitPct).toBe("0.12%");
    expect(spr?.section).toBe(ROI_SUMMARY_TRAFFIC_SECTION);
    expect(spr?.notes).toBe(ROI_SUMMARY_TRAFFIC_NOTE);
    expect(spr?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(spr?.notes).toContain("cannot improve further toward 80");
    expect(spr?.notes).toContain("Absorbs former VRX");
    expect(spr?.section.toLowerCase()).not.toBe("marketing");
  });
});
