import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  AUTH_INVITE_TRAFFIC_NOTE,
  AUTH_INVITE_TRAFFIC_PATH,
  AUTH_INVITE_TRAFFIC_ROW_ID,
  AUTH_INVITE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-auth-invite";

describe("ui-route-traffic-auth-invite (AUI)", () => {
  it("tracks auth invite under Auth with honest handoff Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === AUTH_INVITE_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(AUTH_INVITE_TRAFFIC_PATH);
    expect(row?.section).toBe(AUTH_INVITE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(AUTH_INVITE_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
