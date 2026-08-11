import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_NOTE,
  ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_PATH,
  ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_ROW_ID,
  ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architecture-governance-tab";

describe("ui-route-traffic-architecture-governance-tab (REG)", () => {
  it("tracks create-home-only governance archTab with honest workbook notes (TB-1856)", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toContain("Create-home-only");
    expect(row?.notes).toContain("decisions-remediation");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
