import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  AUTH_DOMAINS_SETTINGS_TRAFFIC_NOTE,
  AUTH_DOMAINS_SETTINGS_TRAFFIC_PATH,
  AUTH_DOMAINS_SETTINGS_TRAFFIC_ROW_ID,
  AUTH_DOMAINS_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-auth-domains-settings";

describe("ui-route-traffic-auth-domains-settings (ADU)", () => {
  it("tracks Sign-in domains settings with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, AUTH_DOMAINS_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(AUTH_DOMAINS_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(AUTH_DOMAINS_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(AUTH_DOMAINS_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AuthDomainsPageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
