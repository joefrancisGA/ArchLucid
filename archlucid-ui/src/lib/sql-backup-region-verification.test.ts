import { describe, expect, it } from "vitest";

import { formatSqlBackupPrimaryRegionLabel, type SqlBackupRegionVerification } from "./sql-backup-region-verification";

function sampleVerification(overrides: Partial<SqlBackupRegionVerification> = {}): SqlBackupRegionVerification {
  return {
    schemaVersion: "1.0",
    kind: "archlucid.sqlBackupRegionVerification.v1",
    verified: true,
    generatedAtUtc: "2026-05-18T00:00:00Z",
    primaryDataRegion: "eastus",
    backupStorageRedundancy: "Geo",
    databaseResourceCount: 2,
    allowedBackupRedundancyModes: ["Geo", "Zone"],
    violations: [],
    missingExplicitRedundancy: [],
    source: {
      assertScript: "scripts/ci/assert_sql_backup_regions.py",
      planInput: "terraform show -json",
    },
    ...overrides,
  };
}

describe("formatSqlBackupPrimaryRegionLabel", () => {
  it("returns the primary data region when present", () => {
    expect(formatSqlBackupPrimaryRegionLabel(sampleVerification())).toBe("eastus");
  });

  it("returns a fallback when the region is missing", () => {
    expect(formatSqlBackupPrimaryRegionLabel(sampleVerification({ primaryDataRegion: null }))).toBe(
      "Primary region not declared in plan",
    );
  });
});
