import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  REPLAY_TRAFFIC_NOTE,
  REPLAY_TRAFFIC_PATH,
  REPLAY_TRAFFIC_ROW_ID,
  REPLAY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-replay";

describe("ui-route-traffic-replay (REP)", () => {
  it("tracks Validate review with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === REPLAY_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(REPLAY_TRAFFIC_PATH);
    expect(row?.section).toBe(REPLAY_TRAFFIC_SECTION);
    expect(row?.notes).toBe(REPLAY_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ReplayFormView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
