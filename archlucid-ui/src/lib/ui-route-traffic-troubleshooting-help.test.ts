import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  TROUBLESHOOTING_HELP_TRAFFIC_NOTE,
  TROUBLESHOOTING_HELP_TRAFFIC_PATH,
  TROUBLESHOOTING_HELP_TRAFFIC_ROW_ID,
  TROUBLESHOOTING_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-troubleshooting-help";

describe("ui-route-traffic-troubleshooting-help (HTX)", () => {
  it("tracks Troubleshooting help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === TROUBLESHOOTING_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(TROUBLESHOOTING_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(TROUBLESHOOTING_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(TROUBLESHOOTING_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpTroubleshootingGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
