import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SSO_WIZARD_TRAFFIC_NOTE,
  SSO_WIZARD_TRAFFIC_PATH,
  SSO_WIZARD_TRAFFIC_ROW_ID,
  SSO_WIZARD_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-sso-wizard";

describe("ui-route-traffic-sso-wizard (ASS)", () => {
  it("tracks SSO wizard under Settings with honest access-hub notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, SSO_WIZARD_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SSO_WIZARD_TRAFFIC_PATH);
    expect(row?.section).toBe(SSO_WIZARD_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SSO_WIZARD_TRAFFIC_NOTE);
    expect(row?.notes).toContain("SsoWizardPageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
