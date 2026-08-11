import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ENTERPRISE_ONBOARDING_HELP_TRAFFIC_NOTE,
  ENTERPRISE_ONBOARDING_HELP_TRAFFIC_PATH,
  ENTERPRISE_ONBOARDING_HELP_TRAFFIC_ROW_ID,
  ENTERPRISE_ONBOARDING_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-enterprise-onboarding-help";

describe("ui-route-traffic-enterprise-onboarding-help (HEX)", () => {
  it("tracks enterprise-onboarding help with Help topic Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ENTERPRISE_ONBOARDING_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ENTERPRISE_ONBOARDING_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(ENTERPRISE_ONBOARDING_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ENTERPRISE_ONBOARDING_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpEnterpriseOnboardingGuideView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
