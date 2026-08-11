import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DATA_HANDLING_HELP_TRAFFIC_NOTE,
  DATA_HANDLING_HELP_TRAFFIC_PATH,
  DATA_HANDLING_HELP_TRAFFIC_ROW_ID,
  DATA_HANDLING_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-data-handling-help";

describe("ui-route-traffic-data-handling-help (HED)", () => {
  it("tracks data-handling help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DATA_HANDLING_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DATA_HANDLING_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(DATA_HANDLING_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DATA_HANDLING_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpDataHandlingTenantIsolationGuideView");
    expect(row?.notes).toContain("Score 65");
    expect(row?.notes).toContain("TB-1654");
  });
});
