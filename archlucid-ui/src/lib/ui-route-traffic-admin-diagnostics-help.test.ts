import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ADMIN_DIAGNOSTICS_HELP_TRAFFIC_NOTE,
  ADMIN_DIAGNOSTICS_HELP_TRAFFIC_PATH,
  ADMIN_DIAGNOSTICS_HELP_TRAFFIC_ROW_ID,
  ADMIN_DIAGNOSTICS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-admin-diagnostics-help";

describe("ui-route-traffic-admin-diagnostics-help (HAE)", () => {
  it("tracks admin-diagnostics help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ADMIN_DIAGNOSTICS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ADMIN_DIAGNOSTICS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(ADMIN_DIAGNOSTICS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ADMIN_DIAGNOSTICS_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpAdminDiagnosticsGuideView");
    expect(row?.notes).toContain("orientation warn callout");
    expect(row?.notes).toContain("Admin-tagged");
    expect(row?.notes).toContain("plain text healthy column");
    expect(row?.notes).not.toContain("claim-discipline");
  });
});
