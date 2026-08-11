import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PILOT_OUTCOMES_TRAFFIC_NOTE,
  PILOT_OUTCOMES_TRAFFIC_PATH,
  PILOT_OUTCOMES_TRAFFIC_ROW_ID,
  PILOT_OUTCOMES_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-pilot-outcomes";

describe("ui-route-traffic-pilot-outcomes (SPP)", () => {
  it("tracks Pilot outcomes with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PILOT_OUTCOMES_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PILOT_OUTCOMES_TRAFFIC_PATH);
    expect(row?.section).toBe(PILOT_OUTCOMES_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PILOT_OUTCOMES_TRAFFIC_NOTE);
    
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
