import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

describe("ui-route-traffic-settings-users-keys-tab (SEU retired)", () => {
  it("omits the parked Users and roles API keys tab from the traffic template", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(rows.some((candidate) => candidate.id === "SEU")).toBe(false);
    expect(rows.some((candidate) => candidate.path === "/administration/users?tab=keys")).toBe(false);
  });
});
