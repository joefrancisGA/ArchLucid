import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CLI_USAGE_HELP_TRAFFIC_NOTE,
  CLI_USAGE_HELP_TRAFFIC_PATH,
  CLI_USAGE_HELP_TRAFFIC_ROW_ID,
  CLI_USAGE_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-cli-usage-help";

describe("ui-route-traffic-cli-usage-help (HCX)", () => {
  it("tracks CLI usage help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === CLI_USAGE_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(CLI_USAGE_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(CLI_USAGE_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(CLI_USAGE_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpCliUsageTechnicalReferenceView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
