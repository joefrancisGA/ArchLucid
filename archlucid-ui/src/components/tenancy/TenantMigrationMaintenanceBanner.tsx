"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchTenantCatalogMigrationStatus } from "@/lib/fetch-tenant-catalog-migration-status";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import {
  buildTenantMigrationOperatorDetailLines,
  formatTenantMigrationStageLabel,
  resolveTenantMigrationSuspendMessage,
  TENANT_MIGRATION_STATUS_POLL_MS,
} from "@/lib/tenant-migration-banner-copy";
import { cn } from "@/lib/utils";

function isMigrationBannerSuppressed(): boolean {
  return (
    isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()
  );
}

/**
 * Operator-shell maintenance banner for tenant catalog migration fan-out (TB-2045, TB-2068).
 */
export function TenantMigrationMaintenanceBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [operatorDetails, setOperatorDetails] = useState<
    ReturnType<typeof buildTenantMigrationOperatorDetailLines>
  >([]);

  useEffect(() => {
    if (isMigrationBannerSuppressed()) {
      return;
    }

    let cancelled = false;
    let requestGeneration = 0;

    async function load() {
      const generation = ++requestGeneration;
      const status = await fetchTenantCatalogMigrationStatus();

      if (cancelled || generation !== requestGeneration) {
        return;
      }

      if (status === null) {
        return;
      }

      if (status.inMigration) {
        setMessage(resolveTenantMigrationSuspendMessage(status));
        setStageLabel(formatTenantMigrationStageLabel(status.stage));
        setOperatorDetails(buildTenantMigrationOperatorDetailLines(status));
      } else {
        setMessage(null);
        setStageLabel(null);
        setOperatorDetails([]);
      }
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

  if (isMigrationBannerSuppressed()) {
    return null;
  }

  if (message === null) {
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
      <p className="m-0 font-semibold text-sky-950 dark:text-sky-100">
        Catalog migration in progress{stageLabel !== null ? ` — ${stageLabel}` : ""}
      </p>
      <p className="m-0 mt-1 leading-snug">
        {message}{" "}
        <Link href="/internal/health" className="font-medium text-sky-950 underline underline-offset-2 dark:text-sky-100">
          System health
        </Link>
        .
      </p>
      {operatorDetails.length > 0 ? (
        <dl
          className="m-0 mt-2 grid gap-1 text-sm text-sky-950/90 dark:text-sky-100/90"
          data-testid="tenant-migration-operator-details"
        >
          {operatorDetails.map((detail) => (
            <div key={detail.label} className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0">
              <dt className="font-medium">{detail.label}</dt>
              <dd className="m-0 break-all font-mono text-xs">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
