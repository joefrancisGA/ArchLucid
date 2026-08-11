import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  AUTHENTICATION_SIGN_IN_HELP_TRAFFIC_NOTE,
  AUTHENTICATION_SIGN_IN_HELP_TRAFFIC_PATH,
  AUTHENTICATION_SIGN_IN_HELP_TRAFFIC_ROW_ID,
  AUTHENTICATION_SIGN_IN_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-authentication-sign-in-help";

describe("ui-route-traffic-authentication-sign-in-help (HEA)", () => {
  it("tracks authentication-sign-in help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === AUTHENTICATION_SIGN_IN_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(AUTHENTICATION_SIGN_IN_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(AUTHENTICATION_SIGN_IN_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(AUTHENTICATION_SIGN_IN_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
