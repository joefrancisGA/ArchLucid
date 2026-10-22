import { describe, expect, it } from "vitest";

import { buildTenantMigrationOperatorDetailLines } from "@/lib/tenant-migration-banner-copy";

describe("buildTenantMigrationOperatorDetailLines", () => {
  it("returns correlation, migration id, and verification error lines", () => {
    const lines = buildTenantMigrationOperatorDetailLines({
      correlationId: "corr-1",
      migrationId: "11111111-2222-3333-4444-555555555555",
      lastVerificationError: "Probe failed",
    });

    expect(lines).toEqual([
      { label: "Correlation id", value: "corr-1" },
      { label: "Migration id", value: "11111111-2222-3333-4444-555555555555" },
      { label: "Last verification error", value: "Probe failed" },
    ]);
  });

  it("omits blank fields", () => {
    expect(buildTenantMigrationOperatorDetailLines({})).toEqual([]);
  });
});
