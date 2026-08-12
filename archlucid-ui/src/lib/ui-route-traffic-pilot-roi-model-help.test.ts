import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PILOT_ROI_MODEL_HELP_TRAFFIC_NOTE,
  PILOT_ROI_MODEL_HELP_TRAFFIC_PATH,
  PILOT_ROI_MODEL_HELP_TRAFFIC_ROW_ID,
  PILOT_ROI_MODEL_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-pilot-roi-model-help";

describe("ui-route-traffic-pilot-roi-model-help (PI)", () => {
  it("tracks pilot-roi-model help with Help topic Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, PILOT_ROI_MODEL_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PILOT_ROI_MODEL_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(PILOT_ROI_MODEL_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PILOT_ROI_MODEL_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpTopicMarkdownView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
