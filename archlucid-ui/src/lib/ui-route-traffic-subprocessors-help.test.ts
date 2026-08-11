import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SUBPROCESSORS_HELP_TRAFFIC_NOTE,
  SUBPROCESSORS_HELP_TRAFFIC_PATH,
  SUBPROCESSORS_HELP_TRAFFIC_ROW_ID,
  SUBPROCESSORS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-subprocessors-help";

describe("ui-route-traffic-subprocessors-help (HEU)", () => {
  it("tracks Subprocessors help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SUBPROCESSORS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SUBPROCESSORS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(SUBPROCESSORS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SUBPROCESSORS_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
