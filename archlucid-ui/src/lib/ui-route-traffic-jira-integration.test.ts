import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  JIRA_INTEGRATION_TRAFFIC_NOTE,
  JIRA_INTEGRATION_TRAFFIC_PATH,
  JIRA_INTEGRATION_TRAFFIC_ROW_ID,
  JIRA_INTEGRATION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-jira-integration";

describe("ui-route-traffic-jira-integration (IJX)", () => {
  it("tracks Jira integration with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === JIRA_INTEGRATION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(JIRA_INTEGRATION_TRAFFIC_PATH);
    expect(row?.section).toBe(JIRA_INTEGRATION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(JIRA_INTEGRATION_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ItsmProductIntegrationPageClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
