import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SIGNUP_TRAFFIC_NOTE,
  SIGNUP_TRAFFIC_PATH,
  SIGNUP_TRAFFIC_ROW_ID,
  SIGNUP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-signup";

describe("ui-route-traffic-signup (SIG)", () => {
  it("tracks Signup under Marketing with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SIGNUP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SIGNUP_TRAFFIC_PATH);
    expect(row?.section).toBe(SIGNUP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SIGNUP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("SignupEvidenceOrientationStrip");
    expect(row?.section).toBe("Marketing");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
