import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  EVIDENCE_TRACE_TRAFFIC_NOTE,
  EVIDENCE_TRACE_TRAFFIC_PATH,
  EVIDENCE_TRACE_TRAFFIC_ROW_ID,
  EVIDENCE_TRACE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-evidence-trace";

describe("ui-route-traffic-evidence-trace (ERU)", () => {
  it("tracks evidence-trace with former RR hit share and no RR row", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const eru = rows.find((candidate) => candidate.id === EVIDENCE_TRACE_TRAFFIC_ROW_ID);
    const rr = rows.find((candidate) => candidate.id === "RR");

    expect(rr).toBeUndefined();
    expect(eru).toBeDefined();
    expect(eru?.path).toBe(EVIDENCE_TRACE_TRAFFIC_PATH);
    expect(eru?.hitPct).toBe("0.4%");
    expect(eru?.section).toBe(EVIDENCE_TRACE_TRAFFIC_SECTION);
    expect(eru?.notes).toBe(EVIDENCE_TRACE_TRAFFIC_NOTE);
    expect(eru?.notes).toContain("Absorbs former RR");
    expect(eru?.notes).toContain("Score 72");
    expect(eru?.notes).toContain("cannot improve further toward 80");
  });
});
