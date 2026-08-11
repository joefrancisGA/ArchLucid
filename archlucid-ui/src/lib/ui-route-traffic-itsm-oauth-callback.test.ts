import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ITSM_OAUTH_CALLBACK_TRAFFIC_NOTE,
  ITSM_OAUTH_CALLBACK_TRAFFIC_PATH,
  ITSM_OAUTH_CALLBACK_TRAFFIC_ROW_ID,
  ITSM_OAUTH_CALLBACK_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-itsm-oauth-callback";

describe("ui-route-traffic-itsm-oauth-callback (IIO)", () => {
  it("tracks the OAuth callback on IIO with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ITSM_OAUTH_CALLBACK_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ITSM_OAUTH_CALLBACK_TRAFFIC_PATH);
    expect(row?.section).toBe(ITSM_OAUTH_CALLBACK_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ITSM_OAUTH_CALLBACK_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ItsmAtlassianOAuthCallbackClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes.toLowerCase()).not.toContain("blocked-by-redirect");
    expect(row?.notes.toLowerCase()).not.toContain("blocked by redirect");
  });
});
