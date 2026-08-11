import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  APPROVAL_QUEUE_TRAFFIC_NOTE,
  APPROVAL_QUEUE_TRAFFIC_PATH,
  APPROVAL_QUEUE_TRAFFIC_ROW_ID,
  APPROVAL_QUEUE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-approval-queue";

describe("ui-route-traffic-approval-queue (GOP)", () => {
  it("tracks approval queue with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === APPROVAL_QUEUE_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(APPROVAL_QUEUE_TRAFFIC_PATH);
    expect(row?.section).toBe(APPROVAL_QUEUE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(APPROVAL_QUEUE_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("Record-decision deep link");
    expect(row?.notes).toContain("auto-fills signed review record version");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
