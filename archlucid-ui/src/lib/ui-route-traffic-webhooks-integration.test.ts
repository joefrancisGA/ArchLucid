import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  WEBHOOKS_INTEGRATION_TRAFFIC_NOTE,
  WEBHOOKS_INTEGRATION_TRAFFIC_PATH,
  WEBHOOKS_INTEGRATION_TRAFFIC_ROW_ID,
  WEBHOOKS_INTEGRATION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-webhooks-integration";

describe("ui-route-traffic-webhooks-integration (IWX)", () => {
  it("tracks Webhooks integration with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === WEBHOOKS_INTEGRATION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(WEBHOOKS_INTEGRATION_TRAFFIC_PATH);
    expect(row?.section).toBe(WEBHOOKS_INTEGRATION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(WEBHOOKS_INTEGRATION_TRAFFIC_NOTE);
    expect(row?.notes).toContain("WebhooksIntegrationPageClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
