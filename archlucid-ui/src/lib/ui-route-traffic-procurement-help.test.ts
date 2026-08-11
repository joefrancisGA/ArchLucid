import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PROCUREMENT_HELP_TRAFFIC_NOTE,
  PROCUREMENT_HELP_TRAFFIC_PATH,
  PROCUREMENT_HELP_TRAFFIC_ROW_ID,
  PROCUREMENT_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-procurement-help";

describe("ui-route-traffic-procurement-help (PRO)", () => {
  it("tracks Procurement FAQ help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PROCUREMENT_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PROCUREMENT_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(PROCUREMENT_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PROCUREMENT_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpTopicMarkdownView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
