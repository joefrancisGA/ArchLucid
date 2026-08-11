import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  EVIDENCE_TRAIL_HELP_TRAFFIC_NOTE,
  EVIDENCE_TRAIL_HELP_TRAFFIC_PATH,
  EVIDENCE_TRAIL_HELP_TRAFFIC_ROW_ID,
  EVIDENCE_TRAIL_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-evidence-trail-help";

describe("ui-route-traffic-evidence-trail-help (EV)", () => {
  it("tracks evidence-trail help with Help topic Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, EVIDENCE_TRAIL_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(EVIDENCE_TRAIL_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(EVIDENCE_TRAIL_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(EVIDENCE_TRAIL_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpTopicMarkdownView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
