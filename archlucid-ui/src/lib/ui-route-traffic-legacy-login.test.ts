import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";
import {
  LEGACY_LOGIN_TRAFFIC_NOTE,
  LEGACY_LOGIN_TRAFFIC_PATH,
  LEGACY_LOGIN_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-legacy-login";

describe("ui-route-traffic legacy login (TB-1794)", () => {
  it("tracks LOG as a redirect-only workbook row", () => {
    const registryRow = findUiRouteTrafficRow(LEGACY_LOGIN_TRAFFIC_ROW_ID);
    const templateRow = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown()).find(
      (row) => row.id === LEGACY_LOGIN_TRAFFIC_ROW_ID,
    );

    expect(registryRow?.path).toBe(LEGACY_LOGIN_TRAFFIC_PATH);
    expect(registryRow?.section).toBe("Redirect shim");
    expect(registryRow?.note).toBe(LEGACY_LOGIN_TRAFFIC_NOTE);
    expect(templateRow?.path).toBe(LEGACY_LOGIN_TRAFFIC_PATH);
    expect(templateRow?.section).toBe("Redirect shim");
    expect(templateRow?.notes).toBe(LEGACY_LOGIN_TRAFFIC_NOTE);
    expect(templateRow?.notes.toLowerCase()).toContain("legacy");
    expect(templateRow?.notes).toContain("/auth/signin");
    expect(templateRow?.notes).not.toMatch(/pagecontextualhelp/i);
  });
});
