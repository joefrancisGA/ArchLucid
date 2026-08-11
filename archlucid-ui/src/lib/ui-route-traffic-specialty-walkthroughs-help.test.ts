import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SPECIALTY_WALKTHROUGHS_HELP_TRAFFIC_NOTE,
  SPECIALTY_WALKTHROUGHS_HELP_TRAFFIC_PATH,
  SPECIALTY_WALKTHROUGHS_HELP_TRAFFIC_ROW_ID,
  SPECIALTY_WALKTHROUGHS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-specialty-walkthroughs-help";

describe("ui-route-traffic-specialty-walkthroughs-help (HS)", () => {
  it("tracks Specialty walkthroughs help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SPECIALTY_WALKTHROUGHS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SPECIALTY_WALKTHROUGHS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(SPECIALTY_WALKTHROUGHS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SPECIALTY_WALKTHROUGHS_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
