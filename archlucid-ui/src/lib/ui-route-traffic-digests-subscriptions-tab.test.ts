import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DIGESTS_SUBSCRIPTIONS_TAB_TRAFFIC_NOTE,
  DIGESTS_SUBSCRIPTIONS_TAB_TRAFFIC_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_TRAFFIC_ROW_ID,
  DIGESTS_SUBSCRIPTIONS_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-digests-subscriptions-tab";

describe("ui-route-traffic-digests-subscriptions-tab (AIS)", () => {
  it("tracks Digests Subscriptions tab with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DIGESTS_SUBSCRIPTIONS_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DIGESTS_SUBSCRIPTIONS_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(DIGESTS_SUBSCRIPTIONS_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DIGESTS_SUBSCRIPTIONS_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toContain("DigestSubscriptionsReadinessPanel");

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
