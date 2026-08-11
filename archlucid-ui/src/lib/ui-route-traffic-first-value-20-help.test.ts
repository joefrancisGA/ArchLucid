import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  FIRST_VALUE_20_HELP_TRAFFIC_NOTE,
  FIRST_VALUE_20_HELP_TRAFFIC_PATH,
  FIRST_VALUE_20_HELP_TRAFFIC_ROW_ID,
  FIRST_VALUE_20_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-first-value-20-help";

describe("ui-route-traffic-first-value-20-help (HEF)", () => {
  it("tracks the canonical first-value-20 help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === FIRST_VALUE_20_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(FIRST_VALUE_20_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(FIRST_VALUE_20_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(FIRST_VALUE_20_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpFirstValue20GuideView");
    expect(row?.notes).toContain("Admin-gated");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
