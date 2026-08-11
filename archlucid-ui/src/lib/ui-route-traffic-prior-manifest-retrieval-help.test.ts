import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_TRAFFIC_NOTE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_TRAFFIC_PATH,
  PRIOR_MANIFEST_RETRIEVAL_HELP_TRAFFIC_ROW_ID,
  PRIOR_MANIFEST_RETRIEVAL_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-prior-manifest-retrieval-help";

describe("ui-route-traffic-prior-manifest-retrieval-help (HPR)", () => {
  it("tracks Prior manifest retrieval help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PRIOR_MANIFEST_RETRIEVAL_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PRIOR_MANIFEST_RETRIEVAL_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(PRIOR_MANIFEST_RETRIEVAL_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PRIOR_MANIFEST_RETRIEVAL_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
