import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import {
  EVIDENCE_INTAKE_HELP_TRAFFIC_NOTE,
  EVIDENCE_INTAKE_HELP_TRAFFIC_PATH,
  EVIDENCE_INTAKE_HELP_TRAFFIC_ROW_ID,
  EVIDENCE_INTAKE_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-evidence-intake-help";

describe("ui-route-traffic-evidence-intake-help (EVI)", () => {
  it("tracks evidence-intake help with Help topic Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === EVIDENCE_INTAKE_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(EVIDENCE_INTAKE_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(EVIDENCE_INTAKE_HELP_TRAFFIC_SECTION);

    expect(EVIDENCE_INTAKE_HELP_TRAFFIC_NOTE).toContain("claim-discipline callout");
    expect(EVIDENCE_INTAKE_HELP_TRAFFIC_NOTE).toContain("Start review header primary action");
    expect(EVIDENCE_INTAKE_HELP_TRAFFIC_NOTE).not.toContain("orientation strip");
    expect(EVIDENCE_INTAKE_HELP_TRAFFIC_NOTE).not.toContain("Ã¢â‚¬â€");
    expect(EVIDENCE_INTAKE_HELP_TRAFFIC_NOTE).toContain("cannot improve further toward 80");
  });
});
