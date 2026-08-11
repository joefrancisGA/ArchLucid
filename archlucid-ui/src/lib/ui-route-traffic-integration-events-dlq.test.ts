import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  INTEGRATION_EVENTS_DLQ_TRAFFIC_NOTE,
  INTEGRATION_EVENTS_DLQ_TRAFFIC_PATH,
  INTEGRATION_EVENTS_DLQ_TRAFFIC_ROW_ID,
  INTEGRATION_EVENTS_DLQ_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-integration-events-dlq";

describe("ui-route-traffic-integration-events-dlq (OID)", () => {
  it("tracks Integration event DLQ with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === INTEGRATION_EVENTS_DLQ_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(INTEGRATION_EVENTS_DLQ_TRAFFIC_PATH);
    expect(row?.section).toBe(INTEGRATION_EVENTS_DLQ_TRAFFIC_SECTION);
    expect(row?.notes).toBe(INTEGRATION_EVENTS_DLQ_TRAFFIC_NOTE);
    expect(row?.notes).toContain("IntegrationEventsDlqPageClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
