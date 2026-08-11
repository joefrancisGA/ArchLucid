import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SETTINGS_USERS_TRAFFIC_NOTE,
  SETTINGS_USERS_TRAFFIC_PATH,
  SETTINGS_USERS_TRAFFIC_ROW_ID,
  SETTINGS_USERS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-settings-users";

describe("ui-route-traffic-settings-users (AUX)", () => {
  it("tracks Users and roles with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SETTINGS_USERS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SETTINGS_USERS_TRAFFIC_PATH);
    expect(row?.section).toBe(SETTINGS_USERS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SETTINGS_USERS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("SettingsRolesPageView");
    expect(row?.notes).toContain("Score 68/100");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
