import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CONNECT_AWS_SECURELY_HELP_TRAFFIC_NOTE,
  CONNECT_AWS_SECURELY_HELP_TRAFFIC_PATH,
  CONNECT_AWS_SECURELY_HELP_TRAFFIC_ROW_ID,
  CONNECT_AWS_SECURELY_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-connect-aws-securely-help";

describe("ui-route-traffic-connect-aws-securely-help (HEC)", () => {
  it("tracks aws cloud-connections help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === CONNECT_AWS_SECURELY_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(CONNECT_AWS_SECURELY_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(CONNECT_AWS_SECURELY_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(CONNECT_AWS_SECURELY_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpConnectAwsSecurelyGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
