import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  INVITE_REVIEWER_TRAFFIC_NOTE,
  INVITE_REVIEWER_TRAFFIC_PATH,
  INVITE_REVIEWER_TRAFFIC_ROW_ID,
  INVITE_REVIEWER_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-invite-reviewer";

describe("ui-route-traffic-invite-reviewer (SRI)", () => {
  it("tracks Invite a reviewer with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === INVITE_REVIEWER_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(INVITE_REVIEWER_TRAFFIC_PATH);
    expect(row?.section).toBe(INVITE_REVIEWER_TRAFFIC_SECTION);
    expect(row?.notes).toBe(INVITE_REVIEWER_TRAFFIC_NOTE);
    expect(row?.notes).toContain("InviteReviewerPageView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
