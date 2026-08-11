import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  API_CONTRACTS_HELP_TRAFFIC_NOTE,
  API_CONTRACTS_HELP_TRAFFIC_PATH,
  API_CONTRACTS_HELP_TRAFFIC_ROW_ID,
  API_CONTRACTS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-api-contracts-help";

describe("ui-route-traffic-api-contracts-help (HG)", () => {
  it("tracks the canonical API contracts help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, API_CONTRACTS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(API_CONTRACTS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(API_CONTRACTS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(API_CONTRACTS_HELP_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("HelpApiContractsGuideView");
    expect(row?.notes).toContain("TB-1386");
    expect(row?.notes).toContain("TB-1388");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
