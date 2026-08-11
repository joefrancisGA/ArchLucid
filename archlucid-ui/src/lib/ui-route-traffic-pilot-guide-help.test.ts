import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PILOT_GUIDE_HELP_TRAFFIC_NOTE,
  PILOT_GUIDE_HELP_TRAFFIC_PATH,
  PILOT_GUIDE_HELP_TRAFFIC_ROW_ID,
  PILOT_GUIDE_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-pilot-guide-help";

describe("ui-route-traffic-pilot-guide-help (HP)", () => {
  it("tracks Pilot guide help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PILOT_GUIDE_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PILOT_GUIDE_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(PILOT_GUIDE_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PILOT_GUIDE_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpPilotGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
