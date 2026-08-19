import type { TenantCatalogMigrationStatus } from "@/lib/fetch-tenant-catalog-migration-status";

/** Poll interval while the operator shell is mounted (TB-2068). */
export const TENANT_MIGRATION_STATUS_POLL_MS = 30_000;

export const TENANT_MIGRATION_DEFAULT_SUSPEND_MESSAGE =
  "Tenant catalog migration in progress — operator reads may be stale and new writes are suspended until verification completes.";

const STAGE_SUSPEND_MESSAGES: Readonly<Record<string, string>> = {
  ScopeFreeze:
    "Tenant scope is frozen for catalog migration — new writes are suspended until verification completes.",
  CatalogAttachDetach:
    "Catalog attach/detach is in progress — writes remain suspended; some reads may fail until cutover completes.",
  ProjectionRefresh:
    "Search indexes, cached preferences, and ROI rollups are rebuilding — reads may be stale; writes remain suspended.",
  Verification:
    "Authorization and read/write verification is running — writes remain suspended until checks pass.",
};

const STAGE_LABELS: Readonly<Record<string, string>> = {
  ScopeFreeze: "Scope freeze",
  CatalogAttachDetach: "Catalog attach/detach",
  ProjectionRefresh: "Projection refresh",
  Verification: "Verification",
};

export function resolveTenantMigrationSuspendMessage(
  status: Pick<TenantCatalogMigrationStatus, "message" | "stage">,
): string {
  const custom = status.message?.trim();

  if (
    custom !== undefined &&
    custom.length > 0 &&
    custom !== TENANT_MIGRATION_DEFAULT_SUSPEND_MESSAGE &&
    !custom.includes("value-report and governance")
  ) {
    return custom;
  }

  const stage = status.stage?.trim();

  if (stage !== undefined && stage.length > 0) {
    const stageMessage = STAGE_SUSPEND_MESSAGES[stage];

    if (stageMessage !== undefined) {
      return stageMessage;
    }
  }

  return TENANT_MIGRATION_DEFAULT_SUSPEND_MESSAGE;
}

export function formatTenantMigrationStageLabel(stage: string | null | undefined): string | null {
  const normalized = stage?.trim();

  if (normalized === undefined || normalized.length === 0) {
    return null;
  }

  return STAGE_LABELS[normalized] ?? normalized;
}

export type TenantMigrationOperatorDetailLine = {
  label: string;
  value: string;
};

/** Correlation id, migration id, and verification errors for operator diagnostics (TB-2070). */
export function buildTenantMigrationOperatorDetailLines(
  status: Pick<
    TenantCatalogMigrationStatus,
    "correlationId" | "migrationId" | "lastVerificationError"
  >,
): TenantMigrationOperatorDetailLine[] {
  const lines: TenantMigrationOperatorDetailLine[] = [];

  const correlationId = status.correlationId?.trim();

  if (correlationId !== undefined && correlationId.length > 0) {
    lines.push({ label: "Correlation id", value: correlationId });
  }

  const migrationId = status.migrationId?.trim();

  if (migrationId !== undefined && migrationId.length > 0) {
    lines.push({ label: "Migration id", value: migrationId });
  }

  const verificationError = status.lastVerificationError?.trim();

  if (verificationError !== undefined && verificationError.length > 0) {
    lines.push({ label: "Last verification error", value: verificationError });
  }

  return lines;
}
