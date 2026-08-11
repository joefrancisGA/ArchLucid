import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  INTEGRATION_READINESS_HELP_TRAFFIC_NOTE,
  INTEGRATION_READINESS_HELP_TRAFFIC_PATH,
  INTEGRATION_READINESS_HELP_TRAFFIC_ROW_ID,
  INTEGRATION_READINESS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-integration-readiness-help";

describe("ui-route-traffic-integration-readiness-help (HEI)", () => {
  it("tracks integration-readiness help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === INTEGRATION_READINESS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(INTEGRATION_READINESS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(INTEGRATION_READINESS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(INTEGRATION_READINESS_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
