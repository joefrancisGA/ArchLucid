import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  POLICY_PACKS_HUB_TRAFFIC_NOTE,
  POLICY_PACKS_HUB_TRAFFIC_PATH,
  POLICY_PACKS_HUB_TRAFFIC_ROW_ID,
  POLICY_PACKS_HUB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-policy-packs-hub";

describe("ui-route-traffic-policy-packs-hub (GPP)", () => {
  it("tracks Policy packs hub with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === POLICY_PACKS_HUB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(POLICY_PACKS_HUB_TRAFFIC_PATH);
    expect(row?.section).toBe(POLICY_PACKS_HUB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(POLICY_PACKS_HUB_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
