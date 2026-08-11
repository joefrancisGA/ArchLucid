import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SIGNUP_VERIFY_TRAFFIC_NOTE,
  SIGNUP_VERIFY_TRAFFIC_PATH,
  SIGNUP_VERIFY_TRAFFIC_ROW_ID,
  SIGNUP_VERIFY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-signup-verify";

describe("ui-route-traffic-signup-verify (SVX)", () => {
  it("tracks Signup verify with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SIGNUP_VERIFY_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SIGNUP_VERIFY_TRAFFIC_PATH);
    expect(row?.section).toBe(SIGNUP_VERIFY_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SIGNUP_VERIFY_TRAFFIC_NOTE);
    expect(row?.notes).toContain("SignupVerifyEvidenceOrientationStrip");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
