import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_NOTE,
  GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH,
  GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_ROW_ID,
  GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-governance-api-contracts-help";

describe("ui-route-traffic-governance-api-contracts-help (HG)", () => {
  it("tracks the canonical governance API contracts help topic with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("HelpApiContractsGuideView");
    expect(row?.notes).toContain("TB-1386");
    expect(row?.notes).toContain("TB-1388");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
