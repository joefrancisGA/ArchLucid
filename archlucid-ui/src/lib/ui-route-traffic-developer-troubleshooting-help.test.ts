import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_NOTE,
  DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_PATH,
  DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_ROW_ID,
  DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-developer-troubleshooting-help";

describe("ui-route-traffic-developer-troubleshooting-help (HDX)", () => {
  it("tracks the canonical engineering runbook help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("HelpTopicAuthorityGate");
    expect(row?.notes).toContain("HelpEngineeringTroubleshootingGuideView");
    expect(row?.notes).toContain("TB-1249");
    expect(row?.notes).not.toContain("Not a specialty guide");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
