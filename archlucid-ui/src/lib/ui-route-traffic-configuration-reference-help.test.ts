import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CONFIGURATION_REFERENCE_HELP_TRAFFIC_NOTE,
  CONFIGURATION_REFERENCE_HELP_TRAFFIC_PATH,
  CONFIGURATION_REFERENCE_HELP_TRAFFIC_ROW_ID,
  CONFIGURATION_REFERENCE_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-configuration-reference-help";

describe("ui-route-traffic-configuration-reference-help (CON)", () => {
  it("tracks the canonical configuration reference help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === CONFIGURATION_REFERENCE_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(CONFIGURATION_REFERENCE_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(CONFIGURATION_REFERENCE_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(CONFIGURATION_REFERENCE_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpConfigurationReferenceGuideView");
    expect(row?.notes).toContain("SSO wizard");
    expect(row?.notes).toContain("Admin internal-runbook");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
