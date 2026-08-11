import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SLACK_INTEGRATION_TRAFFIC_NOTE,
  SLACK_INTEGRATION_TRAFFIC_PATH,
  SLACK_INTEGRATION_TRAFFIC_ROW_ID,
  SLACK_INTEGRATION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-slack-integration";

describe("ui-route-traffic-slack-integration (ISN)", () => {
  it("tracks Slack integration with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SLACK_INTEGRATION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SLACK_INTEGRATION_TRAFFIC_PATH);
    expect(row?.section).toBe(SLACK_INTEGRATION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SLACK_INTEGRATION_TRAFFIC_NOTE);
    expect(row?.notes).toContain("SlackIntegrationPageClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
