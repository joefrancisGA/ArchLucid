import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CONNECT_AZURE_SECURELY_HELP_TRAFFIC_NOTE,
  CONNECT_AZURE_SECURELY_HELP_TRAFFIC_PATH,
  CONNECT_AZURE_SECURELY_HELP_TRAFFIC_ROW_ID,
  CONNECT_AZURE_SECURELY_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-connect-azure-securely-help";

describe("ui-route-traffic-connect-azure-securely-help (HC)", () => {
  it("tracks Connect Azure securely help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === CONNECT_AZURE_SECURELY_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(CONNECT_AZURE_SECURELY_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(CONNECT_AZURE_SECURELY_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(CONNECT_AZURE_SECURELY_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpConnectAzureSecurelyGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
