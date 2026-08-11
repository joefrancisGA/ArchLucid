import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ALERTS_INBOX_TRAFFIC_NOTE,
  ALERTS_INBOX_TRAFFIC_PATH,
  ALERTS_INBOX_TRAFFIC_ROW_ID,
  ALERTS_INBOX_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-alerts-inbox";

describe("ui-route-traffic-alerts-inbox (AL)", () => {
  it("tracks Alert inbox under Alerts/gov with triage launcher Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ALERTS_INBOX_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ALERTS_INBOX_TRAFFIC_PATH);
    expect(row?.section).toBe(ALERTS_INBOX_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ALERTS_INBOX_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
