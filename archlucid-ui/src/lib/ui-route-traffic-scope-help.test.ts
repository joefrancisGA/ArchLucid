import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SCOPE_HELP_TRAFFIC_NOTE,
  SCOPE_HELP_TRAFFIC_PATH,
  SCOPE_HELP_TRAFFIC_ROW_ID,
  SCOPE_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-scope-help";

describe("ui-route-traffic-scope-help (HSX)", () => {
  it("tracks Workspace and scope help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SCOPE_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SCOPE_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(SCOPE_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SCOPE_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpTopicMarkdownView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
