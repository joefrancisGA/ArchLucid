import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  EVIDENCE_GRAPH_TRAFFIC_NOTE,
  EVIDENCE_GRAPH_TRAFFIC_PATH,
  EVIDENCE_GRAPH_TRAFFIC_ROW_ID,
  EVIDENCE_GRAPH_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-evidence-graph";

describe("ui-route-traffic-evidence-graph (GRA)", () => {
  it("tracks the canonical evidence graph with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, EVIDENCE_GRAPH_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(EVIDENCE_GRAPH_TRAFFIC_PATH);
    expect(row?.section).toBe(EVIDENCE_GRAPH_TRAFFIC_SECTION);
    expect(row?.notes).toBe(EVIDENCE_GRAPH_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("GraphPageContent");
    expect(row?.notes).toContain("evidence");
  });
});
