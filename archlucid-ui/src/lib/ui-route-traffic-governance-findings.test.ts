import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GOVERNANCE_FINDINGS_TRAFFIC_NOTE,
  GOVERNANCE_FINDINGS_TRAFFIC_PATH,
  GOVERNANCE_FINDINGS_TRAFFIC_ROW_ID,
  GOVERNANCE_FINDINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-governance-findings";

describe("ui-route-traffic-governance-findings (GFN)", () => {
  it("tracks Findings queue under Alerts/gov with risk-register Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === GOVERNANCE_FINDINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(GOVERNANCE_FINDINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(GOVERNANCE_FINDINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(GOVERNANCE_FINDINGS_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
