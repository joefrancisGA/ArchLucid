import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GOVERNANCE_APPROVAL_HELP_TRAFFIC_NOTE,
  GOVERNANCE_APPROVAL_HELP_TRAFFIC_PATH,
  GOVERNANCE_APPROVAL_HELP_TRAFFIC_ROW_ID,
  GOVERNANCE_APPROVAL_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-governance-approval-help";

describe("ui-route-traffic-governance-approval-help (GO)", () => {
  it("tracks the canonical governance approval help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, GOVERNANCE_APPROVAL_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(GOVERNANCE_APPROVAL_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(GOVERNANCE_APPROVAL_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(GOVERNANCE_APPROVAL_HELP_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("HelpGovernanceApprovalGuideView");
    expect(row?.notes).toContain("claim-discipline");
    expect(row?.notes).toContain("TB-1387");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
