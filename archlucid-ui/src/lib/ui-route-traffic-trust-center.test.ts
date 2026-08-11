import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  TRUST_CENTER_TRAFFIC_NOTE,
  TRUST_CENTER_TRAFFIC_PATH,
  TRUST_CENTER_TRAFFIC_ROW_ID,
  TRUST_CENTER_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-trust-center";

describe("ui-route-traffic-trust-center (TXX)", () => {
  it("tracks Trust Center with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === TRUST_CENTER_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(TRUST_CENTER_TRAFFIC_PATH);
    expect(row?.section).toBe(TRUST_CENTER_TRAFFIC_SECTION);
    expect(row?.notes).toBe(TRUST_CENTER_TRAFFIC_NOTE);
    expect(row?.notes).toContain("MarketingTrustCenterBuyerBody");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
