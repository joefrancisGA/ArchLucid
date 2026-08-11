import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_TRAFFIC_NOTE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_TRAFFIC_PATH,
  IDENTITY_PROVIDERS_DIAGNOSTICS_TRAFFIC_ROW_ID,
  IDENTITY_PROVIDERS_DIAGNOSTICS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-identity-providers-diagnostics";

describe("ui-route-traffic-identity-providers-diagnostics (SEI)", () => {
  it("tracks Identity diagnostics under Settings with honest diagnostic notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, IDENTITY_PROVIDERS_DIAGNOSTICS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(IDENTITY_PROVIDERS_DIAGNOSTICS_TRAFFIC_PATH);
    expect(row?.section).toBe(IDENTITY_PROVIDERS_DIAGNOSTICS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(IDENTITY_PROVIDERS_DIAGNOSTICS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("IdentityProvidersDiagnosticsPageView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
