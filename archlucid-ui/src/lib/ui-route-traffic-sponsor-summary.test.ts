import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SPONSOR_SUMMARY_TRAFFIC_NOTE,
  SPONSOR_SUMMARY_TRAFFIC_PATH,
  SPONSOR_SUMMARY_TRAFFIC_ROW_ID,
  SPONSOR_SUMMARY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-sponsor-report";

describe("ui-route-traffic-sponsor-report (TB-1961)", () => {
  it("tracks SPE with absorbed legacy VXX hit-share note", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const spe = rows.find((candidate) => candidate.id === SPONSOR_SUMMARY_TRAFFIC_ROW_ID);

    expect(spe).toBeDefined();
    expect(spe?.id).toBe("SPE");
    expect(spe?.path).toBe(SPONSOR_SUMMARY_TRAFFIC_PATH);
    expect(spe?.hitPct).toBe("0.22%");
    expect(spe?.section).toBe(SPONSOR_SUMMARY_TRAFFIC_SECTION);
    expect(spe?.notes).toBe(SPONSOR_SUMMARY_TRAFFIC_NOTE);
    expect(spe?.notes).toContain("Absorbs former VXX");
    expect(spe?.notes).toContain("Sources");
    expect(spe?.notes).toContain("ValueReportPageClient");
    expect(spe?.notes).toContain("cannot improve further toward 80");
    expect(spe?.section.toLowerCase()).not.toBe("marketing");
  });
});
