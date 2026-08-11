import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GOVERNANCE_AUDIT_TRAFFIC_NOTE,
  GOVERNANCE_AUDIT_TRAFFIC_PATH,
  GOVERNANCE_AUDIT_TRAFFIC_ROW_ID,
  GOVERNANCE_AUDIT_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-governance-audit";

describe("ui-route-traffic-governance-audit (AUD)", () => {
  it("tracks Governance audit trail with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === GOVERNANCE_AUDIT_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(GOVERNANCE_AUDIT_TRAFFIC_PATH);
    expect(row?.section).toBe(GOVERNANCE_AUDIT_TRAFFIC_SECTION);
    expect(row?.notes).toBe(GOVERNANCE_AUDIT_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AuditPageView");
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
