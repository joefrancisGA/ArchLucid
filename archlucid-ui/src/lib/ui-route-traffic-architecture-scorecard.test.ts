import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ARCHITECTURE_SCORECARD_TRAFFIC_NOTE,
  ARCHITECTURE_SCORECARD_TRAFFIC_PATH,
  ARCHITECTURE_SCORECARD_TRAFFIC_ROW_ID,
  ARCHITECTURE_SCORECARD_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architecture-scorecard";

describe("ui-route-traffic-architecture-scorecard (TB-1956)", () => {
  it("tracks SCX under Insights with canonical-path notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ARCHITECTURE_SCORECARD_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ARCHITECTURE_SCORECARD_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURE_SCORECARD_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURE_SCORECARD_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
