"use client";

import { useEffect, useState } from "react";

import { fetchTenantCatalogMigrationStatus } from "@/lib/fetch-tenant-catalog-migration-status";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildTenantMigrationOperatorDetailLines,
  formatTenantMigrationStageLabel,
  resolveTenantMigrationSuspendMessage,
  TENANT_MIGRATION_STATUS_POLL_MS,
} from "@/lib/tenant-migration-banner-copy";
import { cn } from "@/lib/utils";

/**
 * Admin diagnostics card for active tenant catalog migrations (TB-2070).
 */
export function TenantCatalogMigrationDiagnosticsSection() {
  const [loading, setLoading] = useState(true);
  const [inMigration, setInMigration] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [operatorDetails, setOperatorDetails] = useState(
    buildTenantMigrationOperatorDetailLines({}),
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const status = await fetchTenantCatalogMigrationStatus();

      if (cancelled) {
        return;
      }

      if (status === null || !status.inMigration) {
        setInMigration(false);
        setMessage(null);
        setStageLabel(null);
        setOperatorDetails([]);
        setLoading(false);
        return;
      }

      setInMigration(true);
      setMessage(resolveTenantMigrationSuspendMessage(status));
      setStageLabel(formatTenantMigrationStageLabel(status.stage));
      setOperatorDetails(buildTenantMigrationOperatorDetailLines(status));
      setLoading(false);
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, TENANT_MIGRATION_STATUS_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (loading || !inMigration) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-md border border-amber-700/40 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      aria-label="Catalog migration status"
      data-testid="admin-catalog-migration-diagnostics"
    >
      <h2 className="m-0 text-base font-semibold">
        Catalog migration{stageLabel !== null ? ` — ${stageLabel}` : ""}
      </h2>
      <p className="m-0 mt-1 leading-snug">{message}</p>
      {operatorDetails.length > 0 ? (
        <dl className="m-0 mt-3 grid gap-2">
          {operatorDetails.map((detail) => (
            <div key={detail.label}>
              <dt className="text-sm font-medium">{detail.label}</dt>
              <dd className="m-0 mt-0.5 break-all font-mono text-xs">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="m-0 mt-3 text-sm text-al-text-secondary">
        Writes remain suspended until verification passes. Retry verification after addressing any error above.
      </p>
    </section>
  );
}
