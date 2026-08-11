import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ARCHITECTURE_INTELLIGENCE_TRAFFIC_NOTE,
  ARCHITECTURE_INTELLIGENCE_TRAFFIC_PATH,
  ARCHITECTURE_INTELLIGENCE_TRAFFIC_ROW_ID,
  ARCHITECTURE_INTELLIGENCE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architecture-intelligence";

describe("ui-route-traffic-architecture-intelligence (AR2 / AIN)", () => {
  it("tracks Architecture intelligence under Core review with honest operator-surface notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ARCHITECTURE_INTELLIGENCE_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ARCHITECTURE_INTELLIGENCE_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURE_INTELLIGENCE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURE_INTELLIGENCE_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("ArchitectureIntelligencePageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
