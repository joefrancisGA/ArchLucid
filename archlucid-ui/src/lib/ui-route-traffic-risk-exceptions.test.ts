import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  RISK_EXCEPTIONS_TRAFFIC_NOTE,
  RISK_EXCEPTIONS_TRAFFIC_PATH,
  RISK_EXCEPTIONS_TRAFFIC_ROW_ID,
  RISK_EXCEPTIONS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-risk-exceptions";

describe("ui-route-traffic-risk-exceptions (GRO)", () => {
  it("tracks Risk exceptions under Alerts/gov with waiver register Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === RISK_EXCEPTIONS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(RISK_EXCEPTIONS_TRAFFIC_PATH);
    expect(row?.section).toBe(RISK_EXCEPTIONS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(RISK_EXCEPTIONS_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
