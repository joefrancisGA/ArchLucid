import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ACCELERATOR_CHOOSER_HELP_TRAFFIC_NOTE,
  ACCELERATOR_CHOOSER_HELP_TRAFFIC_PATH,
  ACCELERATOR_CHOOSER_HELP_TRAFFIC_ROW_ID,
  ACCELERATOR_CHOOSER_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-accelerator-chooser-help";

describe("ui-route-traffic-accelerator-chooser-help (HAX)", () => {
  it("tracks accelerator-chooser help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ACCELERATOR_CHOOSER_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ACCELERATOR_CHOOSER_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(ACCELERATOR_CHOOSER_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ACCELERATOR_CHOOSER_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline|accelerator-chooser/i);
    expect(row?.notes).toContain("ACCELERATOR_CHOOSER_ENTRIES");
    expect(row?.notes).toContain("HelpAcceleratorChooserGuideView");
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
