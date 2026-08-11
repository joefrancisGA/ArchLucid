import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  TRIAL_FUNNEL_TRAFFIC_NOTE,
  TRIAL_FUNNEL_TRAFFIC_PATH,
  TRIAL_FUNNEL_TRAFFIC_ROW_ID,
  TRIAL_FUNNEL_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-trial-funnel";

describe("ui-route-traffic-trial-funnel (ATD)", () => {
  it("tracks Trial funnel with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === TRIAL_FUNNEL_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(TRIAL_FUNNEL_TRAFFIC_PATH);
    expect(row?.section).toBe(TRIAL_FUNNEL_TRAFFIC_SECTION);
    expect(row?.notes).toBe(TRIAL_FUNNEL_TRAFFIC_NOTE);
    expect(row?.notes).toContain("TrialFunnelOpsPageClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
