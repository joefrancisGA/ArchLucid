import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PRIVACY_TRAFFIC_NOTE,
  PRIVACY_TRAFFIC_PATH,
  PRIVACY_TRAFFIC_ROW_ID,
  PRIVACY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-privacy";

describe("ui-route-traffic-privacy (PRB)", () => {
  it("tracks Privacy Policy with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PRIVACY_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PRIVACY_TRAFFIC_PATH);
    expect(row?.section).toBe(PRIVACY_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PRIVACY_TRAFFIC_NOTE);
    expect(row?.notes).toContain("PrivacyPolicyPageClient");
    expect(row?.notes).toContain("PrivacyEvidenceOrientationStrip");

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
