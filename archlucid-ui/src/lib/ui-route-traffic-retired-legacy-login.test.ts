import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CANONICAL_AUTH_SIGNIN_TRAFFIC_PATH,
  REMOVED_LEGACY_LOGIN_TRAFFIC_ROW_ID,
  RETIRED_LEGACY_LOGIN_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-retired-legacy-login";

describe("ui-route-traffic-retired-legacy-login (LOG removed)", () => {
  it("does not track retired LOG; sign-in stays on ASI", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const logRow = rows.find((row) => row.id === REMOVED_LEGACY_LOGIN_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === RETIRED_LEGACY_LOGIN_TRAFFIC_PATH);
    const signInRow = rows.find((row) => row.id === "ASI");

    expect(logRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(signInRow?.path).toBe(CANONICAL_AUTH_SIGNIN_TRAFFIC_PATH);
    expect(signInRow?.notes.toLowerCase()).not.toContain("log = legacy /login");
  });
});
