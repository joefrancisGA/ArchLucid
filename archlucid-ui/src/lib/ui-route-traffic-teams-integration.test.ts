import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  TEAMS_INTEGRATION_TRAFFIC_NOTE,
  TEAMS_INTEGRATION_TRAFFIC_PATH,
  TEAMS_INTEGRATION_TRAFFIC_ROW_ID,
  TEAMS_INTEGRATION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-teams-integration";

describe("ui-route-traffic-teams-integration (ITX)", () => {
  it("tracks Teams integration with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === TEAMS_INTEGRATION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(TEAMS_INTEGRATION_TRAFFIC_PATH);
    expect(row?.section).toBe(TEAMS_INTEGRATION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(TEAMS_INTEGRATION_TRAFFIC_NOTE);
    expect(row?.notes).toContain("TeamsNotificationsIntegrationPageView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
