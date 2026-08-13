import { describe, expect, it } from "vitest";

import { shouldFetchTenantUsageStatusForTeamExpansionNudge } from "@/lib/team-expansion-nudge-usage-fetch";

describe("shouldFetchTenantUsageStatusForTeamExpansionNudge", () => {
  it("waits until trial-status has resolved", () => {
    expect(shouldFetchTenantUsageStatusForTeamExpansionNudge({ status: "None" }, false)).toBe(false);
  });

  it("fetches for paid tenants with no active trial lifecycle", () => {
    expect(shouldFetchTenantUsageStatusForTeamExpansionNudge({ status: "None" }, true)).toBe(true);
    expect(shouldFetchTenantUsageStatusForTeamExpansionNudge({ status: "Converted" }, true)).toBe(true);
    expect(shouldFetchTenantUsageStatusForTeamExpansionNudge(null, true)).toBe(true);
  });

  it("skips fetch for trial lifecycle tenants", () => {
    expect(shouldFetchTenantUsageStatusForTeamExpansionNudge({ status: "Active" }, true)).toBe(false);
    expect(shouldFetchTenantUsageStatusForTeamExpansionNudge({ status: "ReadOnly" }, true)).toBe(false);
    expect(shouldFetchTenantUsageStatusForTeamExpansionNudge({ status: "ExportOnly" }, true)).toBe(false);
    expect(shouldFetchTenantUsageStatusForTeamExpansionNudge({ status: "Expired" }, true)).toBe(false);
  });
});
