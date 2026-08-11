import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SECURITY_TRUST_TRAFFIC_NOTE,
  SECURITY_TRUST_TRAFFIC_PATH,
  SECURITY_TRUST_TRAFFIC_ROW_ID,
  SECURITY_TRUST_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-security-trust";

describe("ui-route-traffic-security-trust (SEC)", () => {
  it("tracks Assurance status with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SECURITY_TRUST_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SECURITY_TRUST_TRAFFIC_PATH);
    expect(row?.section).toBe(SECURITY_TRUST_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SECURITY_TRUST_TRAFFIC_NOTE);
    expect(row?.notes).toContain("MarketingSecurityTrustView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
