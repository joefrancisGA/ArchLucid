import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_NOTE,
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH,
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_ROW_ID,
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-first-architecture-review-help";

describe("ui-route-traffic-first-architecture-review-help (COR)", () => {
  it("tracks the canonical first-review help topic with specialty-guide workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("HelpCorePilotGuideView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
