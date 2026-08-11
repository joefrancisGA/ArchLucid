import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  RAG_HEALTH_TRAFFIC_NOTE,
  RAG_HEALTH_TRAFFIC_PATH,
  RAG_HEALTH_TRAFFIC_ROW_ID,
  RAG_HEALTH_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-rag-health";

describe("ui-route-traffic-rag-health (ARX)", () => {
  it("tracks RAG corpus health under Admin with corpus ops Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === RAG_HEALTH_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(RAG_HEALTH_TRAFFIC_PATH);
    expect(row?.section).toBe(RAG_HEALTH_TRAFFIC_SECTION);
    expect(row?.notes).toBe(RAG_HEALTH_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
