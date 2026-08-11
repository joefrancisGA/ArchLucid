import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GETTING_STARTED_HELP_TRAFFIC_NOTE,
  GETTING_STARTED_HELP_TRAFFIC_PATH,
  GETTING_STARTED_HELP_TRAFFIC_ROW_ID,
  GETTING_STARTED_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-getting-started-help";

describe("ui-route-traffic-getting-started-help (HGX)", () => {
  it("tracks Getting started help under Help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === GETTING_STARTED_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(GETTING_STARTED_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(GETTING_STARTED_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(GETTING_STARTED_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpGettingStartedGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
