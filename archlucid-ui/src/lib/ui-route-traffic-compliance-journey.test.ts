import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  COMPLIANCE_JOURNEY_TRAFFIC_NOTE,
  COMPLIANCE_JOURNEY_TRAFFIC_PATH,
  COMPLIANCE_JOURNEY_TRAFFIC_ROW_ID,
  COMPLIANCE_JOURNEY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-compliance-journey";

describe("ui-route-traffic-compliance-journey (COM)", () => {
  it("tracks compliance journey under Marketing with honest posture Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === COMPLIANCE_JOURNEY_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(COMPLIANCE_JOURNEY_TRAFFIC_PATH);
    expect(row?.section).toBe(COMPLIANCE_JOURNEY_TRAFFIC_SECTION);
    expect(row?.notes).toBe(COMPLIANCE_JOURNEY_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ComplianceJourneyEvidenceOrientationStrip");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
