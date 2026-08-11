import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  EVIDENCE_PROPOSALS_TRAFFIC_NOTE,
  EVIDENCE_PROPOSALS_TRAFFIC_PATH,
  EVIDENCE_PROPOSALS_TRAFFIC_ROW_ID,
  EVIDENCE_PROPOSALS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-evidence-proposals";

describe("ui-route-traffic-evidence-proposals (AEX)", () => {
  it("tracks Evidence proposals under Admin with proposal triage Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === EVIDENCE_PROPOSALS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(EVIDENCE_PROPOSALS_TRAFFIC_PATH);
    expect(row?.section).toBe(EVIDENCE_PROPOSALS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(EVIDENCE_PROPOSALS_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
