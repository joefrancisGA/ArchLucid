import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  AZURE_BOARDS_INTEGRATION_TRAFFIC_NOTE,
  AZURE_BOARDS_INTEGRATION_TRAFFIC_PATH,
  AZURE_BOARDS_INTEGRATION_TRAFFIC_ROW_ID,
  AZURE_BOARDS_INTEGRATION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-azure-boards-integration";

describe("ui-route-traffic-azure-boards-integration (INZ)", () => {
  it("tracks Azure Boards integration with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === AZURE_BOARDS_INTEGRATION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(AZURE_BOARDS_INTEGRATION_TRAFFIC_PATH);
    expect(row?.section).toBe(AZURE_BOARDS_INTEGRATION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(AZURE_BOARDS_INTEGRATION_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
