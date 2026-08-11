import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DPA_TEMPLATE_HELP_TRAFFIC_NOTE,
  DPA_TEMPLATE_HELP_TRAFFIC_PATH,
  DPA_TEMPLATE_HELP_TRAFFIC_ROW_ID,
  DPA_TEMPLATE_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-dpa-template-help";

describe("ui-route-traffic-dpa-template-help (HDP)", () => {
  it("tracks the canonical DPA template help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DPA_TEMPLATE_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DPA_TEMPLATE_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(DPA_TEMPLATE_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DPA_TEMPLATE_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpDpaTemplateGuideView");
    expect(row?.notes).toContain("not countersigned");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
