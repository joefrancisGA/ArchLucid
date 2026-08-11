import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CONNECT_GCP_SECURELY_HELP_TRAFFIC_NOTE,
  CONNECT_GCP_SECURELY_HELP_TRAFFIC_PATH,
  CONNECT_GCP_SECURELY_HELP_TRAFFIC_ROW_ID,
  CONNECT_GCP_SECURELY_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-connect-gcp-securely-help";

describe("ui-route-traffic-connect-gcp-securely-help (HGC)", () => {
  it("tracks gcp cloud-connections help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === CONNECT_GCP_SECURELY_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(CONNECT_GCP_SECURELY_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(CONNECT_GCP_SECURELY_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(CONNECT_GCP_SECURELY_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
