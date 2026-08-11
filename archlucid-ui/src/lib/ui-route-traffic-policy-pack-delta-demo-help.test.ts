import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  POLICY_PACK_DELTA_DEMO_HELP_TRAFFIC_NOTE,
  POLICY_PACK_DELTA_DEMO_HELP_TRAFFIC_PATH,
  POLICY_PACK_DELTA_DEMO_HELP_TRAFFIC_ROW_ID,
  POLICY_PACK_DELTA_DEMO_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-policy-pack-delta-demo-help";

describe("ui-route-traffic-policy-pack-delta-demo-help (POL)", () => {
  it("tracks the canonical policy-pack delta demo help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === POLICY_PACK_DELTA_DEMO_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(POLICY_PACK_DELTA_DEMO_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(POLICY_PACK_DELTA_DEMO_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(POLICY_PACK_DELTA_DEMO_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpPolicyPackDeltaDemoGuideView");
    expect(row?.notes).toContain("dry-run");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
