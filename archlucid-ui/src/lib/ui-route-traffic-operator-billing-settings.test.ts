import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  OPERATOR_BILLING_SETTINGS_TRAFFIC_NOTE,
  OPERATOR_BILLING_SETTINGS_TRAFFIC_PATH,
  OPERATOR_BILLING_SETTINGS_TRAFFIC_ROW_ID,
  OPERATOR_BILLING_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-operator-billing-settings";

describe("ui-route-traffic-operator-billing-settings (ABI)", () => {
  it("tracks Billing & plans settings with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, OPERATOR_BILLING_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(OPERATOR_BILLING_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(OPERATOR_BILLING_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(OPERATOR_BILLING_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("OperatorBillingSettingsClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
