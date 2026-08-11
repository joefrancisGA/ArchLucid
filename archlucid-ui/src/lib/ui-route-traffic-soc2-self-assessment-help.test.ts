import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_NOTE,
  SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_PATH,
  SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_ROW_ID,
  SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-soc2-self-assessment-help";

describe("ui-route-traffic-soc2-self-assessment-help (HES)", () => {
  it("tracks the canonical SOC 2 self-assessment help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SOC2_SELF_ASSESSMENT_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpSoc2SelfAssessmentGuideView");
    expect(row?.notes).toContain("not CPA");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
