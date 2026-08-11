import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  COMPARISON_REPLAY_HELP_TRAFFIC_NOTE,
  COMPARISON_REPLAY_HELP_TRAFFIC_PATH,
  COMPARISON_REPLAY_HELP_TRAFFIC_ROW_ID,
  COMPARISON_REPLAY_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-comparison-replay-help";

describe("ui-route-traffic-comparison-replay-help (CO)", () => {
  it("tracks comparison-replay help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === COMPARISON_REPLAY_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(COMPARISON_REPLAY_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(COMPARISON_REPLAY_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(COMPARISON_REPLAY_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/HelpComparisonReplayGuideView|PageContextualHelp|decision panel/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
