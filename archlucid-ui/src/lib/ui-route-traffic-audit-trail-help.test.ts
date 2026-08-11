import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  AUDIT_TRAIL_HELP_TRAFFIC_NOTE,
  AUDIT_TRAIL_HELP_TRAFFIC_PATH,
  AUDIT_TRAIL_HELP_TRAFFIC_ROW_ID,
  AUDIT_TRAIL_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-audit-trail-help";

describe("ui-route-traffic-audit-trail-help (H)", () => {
  it("tracks Audit trail help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === AUDIT_TRAIL_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(AUDIT_TRAIL_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(AUDIT_TRAIL_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(AUDIT_TRAIL_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpAuditTrailGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
