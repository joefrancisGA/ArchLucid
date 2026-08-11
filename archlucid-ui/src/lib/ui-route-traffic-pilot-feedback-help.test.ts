import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PILOT_FEEDBACK_HELP_TRAFFIC_NOTE,
  PILOT_FEEDBACK_HELP_TRAFFIC_PATH,
  PILOT_FEEDBACK_HELP_TRAFFIC_ROW_ID,
  PILOT_FEEDBACK_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-pilot-feedback-help";

describe("ui-route-traffic-pilot-feedback-help (HPE)", () => {
  it("tracks pilot-feedback help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PILOT_FEEDBACK_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PILOT_FEEDBACK_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(PILOT_FEEDBACK_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PILOT_FEEDBACK_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
