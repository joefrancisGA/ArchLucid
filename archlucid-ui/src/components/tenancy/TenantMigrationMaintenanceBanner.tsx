"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchTenantCatalogMigrationStatus } from "@/lib/fetch-tenant-catalog-migration-status";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { cn } from "@/lib/utils";

const DEFAULT_MESSAGE =
  "Tenant catalog migration in progress — value-report and governance reads may be stale; writes are frozen until verification completes.";

/**
 * Maintenance banner for tenant catalog migration fan-out (TB-2045).
 */
export function TenantMigrationMaintenanceBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
      return;
    }

    let cancelled = false;

    async function load() {
      const status = await fetchTenantCatalogMigrationStatus();

      if (cancelled) {
        return;
      }

      if (status?.inMigration) {
        setMessage(status.message?.trim() || DEFAULT_MESSAGE);
      } else {
        setMessage(null);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 rounded-md border border-sky-700/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="alert"
      data-testid="tenant-migration-maintenance-banner"
    >
      <p className="m-0 font-semibold text-sky-950 dark:text-sky-100">Catalog migration in progress</p>
      <p className="m-0 mt-1 leading-snug">
        {message}{" "}
        <Link href="/admin/health" className="font-medium text-sky-950 underline underline-offset-2 dark:text-sky-100">
          System health
        </Link>
        .
      </p>
    </div>
  );
}
