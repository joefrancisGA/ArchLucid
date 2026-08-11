import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  FINDINGS_HELP_TRAFFIC_NOTE,
  FINDINGS_HELP_TRAFFIC_PATH,
  FINDINGS_HELP_TRAFFIC_ROW_ID,
  FINDINGS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-findings-help";

describe("ui-route-traffic-findings-help (HFX)", () => {
  it("tracks the canonical findings help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, FINDINGS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(FINDINGS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(FINDINGS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(FINDINGS_HELP_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("HelpFindingsGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("TB-1387");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
