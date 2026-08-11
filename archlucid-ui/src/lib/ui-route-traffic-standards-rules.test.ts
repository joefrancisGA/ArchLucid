import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  STANDARDS_RULES_TRAFFIC_NOTE,
  STANDARDS_RULES_TRAFFIC_PATH,
  STANDARDS_RULES_TRAFFIC_ROW_ID,
  STANDARDS_RULES_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-standards-rules";

describe("ui-route-traffic-standards-rules (GRS)", () => {
  it("tracks Standards & rules with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === STANDARDS_RULES_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(STANDARDS_RULES_TRAFFIC_PATH);
    expect(row?.section).toBe(STANDARDS_RULES_TRAFFIC_SECTION);
    expect(row?.notes).toBe(STANDARDS_RULES_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
