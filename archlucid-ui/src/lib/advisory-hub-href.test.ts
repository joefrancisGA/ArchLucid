import { describe, expect, it } from "vitest";

import { buildAdvisoryHubHref } from "./advisory-hub-href";

describe("buildAdvisoryHubHref", () => {
  it("returns bare scans path by default", () => {
    expect(buildAdvisoryHubHref({})).toBe("/governance/advisory-scans");
  });

  it("preserves runId on scans and schedules tabs", () => {
    expect(buildAdvisoryHubHref({ runId: "run-1" })).toBe("/governance/advisory-scans?runId=run-1");
    expect(buildAdvisoryHubHref({ tab: "schedules", runId: "run-1" })).toBe(
      "/governance/advisory-scans?tab=schedules&runId=run-1",
    );
  });
});
