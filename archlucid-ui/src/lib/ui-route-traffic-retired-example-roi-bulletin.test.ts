import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  REMOVED_EXAMPLE_ROI_BULLETIN_TRAFFIC_ROW_ID,
  RETIRED_EXAMPLE_ROI_BULLETIN_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-retired-example-roi-bulletin";

describe("ui-route-traffic example ROI bulletin retirement", () => {
  it("does not track retired EXA or the removed marketing path", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const exaRow = rows.find((row) => row.id === REMOVED_EXAMPLE_ROI_BULLETIN_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === RETIRED_EXAMPLE_ROI_BULLETIN_TRAFFIC_PATH);

    expect(exaRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
  });
});
