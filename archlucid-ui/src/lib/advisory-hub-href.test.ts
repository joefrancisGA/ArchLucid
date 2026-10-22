import { describe, expect, it } from "vitest";

import { buildAdvisoryHubHref } from "./advisory-hub-href";

describe("buildAdvisoryHubHref", () => {
  it("returns scans tab deep link by default (TB-1565)", () => {
    expect(buildAdvisoryHubHref({})).toBe("/governance/advisory-scans?tab=scans");
  });

  it("preserves runId on scans and schedules tabs", () => {
    expect(buildAdvisoryHubHref({ runId: "run-1" })).toBe(
      "/governance/advisory-scans?tab=scans&runId=run-1",
    );
    expect(buildAdvisoryHubHref({ tab: "schedules", runId: "run-1" })).toBe(
      "/governance/advisory-scans?tab=schedules&runId=run-1",
    );
  });
});
