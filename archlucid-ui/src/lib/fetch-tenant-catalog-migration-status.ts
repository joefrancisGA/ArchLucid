export type TenantCatalogMigrationStatus = {
  inMigration: boolean;
  message?: string | null;
  correlationId?: string | null;
  stage?: string | null;
  migrationId?: string | null;
  lastVerificationError?: string | null;
};

/** Tenant catalog migration maintenance status (`GET /v1/tenant/catalog-migration-status`).
 * Returns `null` when status cannot be determined (network/non-OK) — callers must not treat that as inactive. */
export async function fetchTenantCatalogMigrationStatus(): Promise<TenantCatalogMigrationStatus | null> {
  try {
    const res = await fetch("/api/proxy/v1/tenant/catalog-migration-status", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as TenantCatalogMigrationStatus;
  } catch {
    return null;
  }
}
