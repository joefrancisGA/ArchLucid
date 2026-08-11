import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";
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

    expect(EVIDENCE_TRAIL_HELP_TRAFFIC_NOTE).toContain("HelpEvidenceTrailGuideView");
    expect(EVIDENCE_TRAIL_HELP_TRAFFIC_NOTE).toContain("Open Evidence graph");
    expect(EVIDENCE_TRAIL_HELP_TRAFFIC_NOTE).toContain("Not bare HelpTopicMarkdownView");
    expect(EVIDENCE_TRAIL_HELP_TRAFFIC_NOTE).not.toContain("Ã¢â‚¬â€");
    expect(EVIDENCE_TRAIL_HELP_TRAFFIC_NOTE).toContain("cannot improve further toward 80");
    expect(row?.notes).toBe(EVIDENCE_TRAIL_HELP_TRAFFIC_NOTE);
  });
});
