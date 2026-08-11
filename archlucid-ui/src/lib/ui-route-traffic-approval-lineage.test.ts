import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  APPROVAL_LINEAGE_TRAFFIC_NOTE,
  APPROVAL_LINEAGE_TRAFFIC_PATH,
  APPROVAL_LINEAGE_TRAFFIC_ROW_ID,
  APPROVAL_LINEAGE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-approval-lineage";

describe("ui-route-traffic-approval-lineage (GAI)", () => {
  it("tracks approval lineage with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === APPROVAL_LINEAGE_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(APPROVAL_LINEAGE_TRAFFIC_PATH);
    expect(row?.section).toBe(APPROVAL_LINEAGE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(APPROVAL_LINEAGE_TRAFFIC_NOTE);
    expect(row?.notes).toContain("GovernanceApprovalLineageDetailContent");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
