import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  BILLING_AND_PLANS_HELP_TRAFFIC_NOTE,
  BILLING_AND_PLANS_HELP_TRAFFIC_PATH,
  BILLING_AND_PLANS_HELP_TRAFFIC_ROW_ID,
  BILLING_AND_PLANS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-billing-and-plans-help";

describe("ui-route-traffic-billing-and-plans-help (HBX)", () => {
  it("tracks Billing and plans help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === BILLING_AND_PLANS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(BILLING_AND_PLANS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(BILLING_AND_PLANS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(BILLING_AND_PLANS_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpBillingAndPlansGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
