import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SETTINGS_SECURITY_TRUST_TRAFFIC_NOTE,
  SETTINGS_SECURITY_TRUST_TRAFFIC_PATH,
  SETTINGS_SECURITY_TRUST_TRAFFIC_ROW_ID,
  SETTINGS_SECURITY_TRUST_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-settings-security-trust";

describe("ui-route-traffic-settings-security-trust (WSX)", () => {
  it("tracks Settings security-trust with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SETTINGS_SECURITY_TRUST_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SETTINGS_SECURITY_TRUST_TRAFFIC_PATH);
    expect(row?.section).toBe(SETTINGS_SECURITY_TRUST_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SETTINGS_SECURITY_TRUST_TRAFFIC_NOTE);
    expect(row?.notes).toContain("OperatorSecurityTrustPageView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
