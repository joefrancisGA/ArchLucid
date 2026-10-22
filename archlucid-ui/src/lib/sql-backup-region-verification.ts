/** Shape of `public/sql-backup-region-verification.json` (from `write_sql_backup_verification_artifact.py`). */
export type SqlBackupRegionVerification = {
  schemaVersion: string;
  kind: string;
  verified: boolean;
  generatedAtUtc: string;
  primaryDataRegion: string | null;
  backupStorageRedundancy: string | null;
  databaseResourceCount: number;
  allowedBackupRedundancyModes: string[];
  violations: ReadonlyArray<{ address: string; detail: string }>;
  missingExplicitRedundancy: ReadonlyArray<string>;
  source: {
    assertScript: string;
    planInput: string;
  };
};

export const SQL_BACKUP_REGION_VERIFICATION_PUBLIC_PATH = "/sql-backup-region-verification.json";

/** Loads the persisted CI verification artifact from the operator UI `public/` folder. */
export async function fetchSqlBackupRegionVerification(): Promise<SqlBackupRegionVerification> {
  const response = await fetch(SQL_BACKUP_REGION_VERIFICATION_PUBLIC_PATH, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load SQL backup verification artifact: HTTP ${response.status}`);
  }

  const parsed: unknown = await response.json();

  return parsed as SqlBackupRegionVerification;
}

/** Human label for the primary Azure data region shown to executives. */
export function formatSqlBackupPrimaryRegionLabel(verification: SqlBackupRegionVerification): string {
  const region = verification.primaryDataRegion?.trim();

  if (region && region.length > 0) {
    return region;
  }

  return "Primary region not declared in plan";
}
