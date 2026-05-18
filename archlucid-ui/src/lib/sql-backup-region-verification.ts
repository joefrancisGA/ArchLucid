import { readFile } from "fs/promises";
import { join } from "path";

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

const PUBLIC_ARTIFACT_FILE = "sql-backup-region-verification.json";

/** Loads the persisted CI verification artifact baked into the operator UI `public/` folder. */
export async function loadSqlBackupRegionVerification(): Promise<SqlBackupRegionVerification> {
  const path = join(process.cwd(), "public", PUBLIC_ARTIFACT_FILE);
  const raw = await readFile(path, "utf-8");
  const parsed: unknown = JSON.parse(raw);

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
