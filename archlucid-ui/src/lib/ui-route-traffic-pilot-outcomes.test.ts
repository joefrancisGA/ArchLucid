import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PILOT_OUTCOMES_TRAFFIC_NOTE,
  PILOT_OUTCOMES_TRAFFIC_PATH,
  PILOT_OUTCOMES_TRAFFIC_ROW_ID,
  PILOT_OUTCOMES_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-pilot-outcomes";

describe("ui-route-traffic-pilot-outcomes (SPP)", () => {
  it("tracks SPP on /insights/pilot-outcomes with sponsor-report section", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const spp = rows.find((candidate) => candidate.id === PILOT_OUTCOMES_TRAFFIC_ROW_ID);

    expect(spp).toBeDefined();
    expect(spp?.path).toBe(PILOT_OUTCOMES_TRAFFIC_PATH);
    expect(spp?.section).toBe(PILOT_OUTCOMES_TRAFFIC_SECTION);
    expect(spp?.notes).toBe(PILOT_OUTCOMES_TRAFFIC_NOTE);
    expect(spp?.notes).toContain("PilotValueReportPageView");
    expect(spp?.notes).toContain("cannot improve further toward 80");
    expect(spp?.section.toLowerCase()).not.toBe("marketing");
  });
});
