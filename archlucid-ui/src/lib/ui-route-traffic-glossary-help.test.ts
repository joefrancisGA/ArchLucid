import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  GLOSSARY_HELP_TRAFFIC_NOTE,
  GLOSSARY_HELP_TRAFFIC_PATH,
  GLOSSARY_HELP_TRAFFIC_ROW_ID,
  GLOSSARY_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-glossary-help";

describe("ui-route-traffic-glossary-help (HGE)", () => {
  it("tracks Glossary help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === GLOSSARY_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(GLOSSARY_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(GLOSSARY_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(GLOSSARY_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpGlossaryPageView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
