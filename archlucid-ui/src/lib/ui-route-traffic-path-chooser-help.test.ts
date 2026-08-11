import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PATH_CHOOSER_HELP_TRAFFIC_NOTE,
  PATH_CHOOSER_HELP_TRAFFIC_PATH,
  PATH_CHOOSER_HELP_TRAFFIC_ROW_ID,
  PATH_CHOOSER_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-path-chooser-help";

describe("ui-route-traffic-path-chooser-help (HPX)", () => {
  it("tracks the canonical path-chooser help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PATH_CHOOSER_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PATH_CHOOSER_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(PATH_CHOOSER_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PATH_CHOOSER_HELP_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("HelpPathChooserGuideView");
    expect(row?.notes).toContain("TB-1712");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
