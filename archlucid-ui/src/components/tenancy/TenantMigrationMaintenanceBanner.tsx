"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTenantCatalogMigrationStatusQuery } from "@/hooks/use-tenant-catalog-migration-status-query";
import { useDocumentHidden } from "@/lib/document-visibility";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import {
  buildTenantMigrationOperatorDetailLines,
  formatTenantMigrationStageLabel,
  resolveTenantMigrationSuspendMessage,
} from "@/lib/tenant-migration-banner-copy";
import { cn } from "@/lib/utils";

function isMigrationBannerSuppressed(): boolean {
  return isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv();
}

/**
 * Operator-shell maintenance banner for tenant catalog migration fan-out (TB-2045, TB-2068).
 */
export function TenantMigrationMaintenanceBanner() {
  const documentHidden = useDocumentHidden();
  const queryEnabled = !isMigrationBannerSuppressed();

  const { data, isError, isRefetchError, refetch } = useTenantCatalogMigrationStatusQuery({
    enabled: queryEnabled,
    documentHidden,
  });

  if (!queryEnabled) {
    return null;
  }

  const refreshFailed = isError || isRefetchError;
  const message =
    data !== undefined && data.inMigration ? resolveTenantMigrationSuspendMessage(data) : null;
  const stageLabel =
    data !== undefined && data.inMigration ? formatTenantMigrationStageLabel(data.stage) : null;
  const operatorDetails =
    data !== undefined && data.inMigration ? buildTenantMigrationOperatorDetailLines(data) : [];

  if (message === null && !refreshFailed) {
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
      {message !== null ? (
        <>
          <p className="m-0 font-semibold text-sky-950 dark:text-sky-100">
            Catalog migration in progress{stageLabel !== null ? ` — ${stageLabel}` : ""}
          </p>
          <p className="m-0 mt-1 leading-snug">
            {message}{" "}
            <Link
              href="/internal/health"
              className="font-medium text-sky-950 underline underline-offset-2 dark:text-sky-100"
            >
              System health
            </Link>
            .
          </p>
        </>
      ) : (
        <p className="m-0 font-semibold text-sky-950 dark:text-sky-100">Catalog migration status unavailable</p>
      )}
      {refreshFailed ? (
        <div className="mt-2 space-y-2" data-testid="tenant-migration-status-refresh-failed">
          <p className="m-0 leading-snug text-sky-950/90 dark:text-sky-100/90">
            {message !== null
              ? "Could not refresh migration status. Showing the last known state until refresh succeeds."
              : "Could not confirm whether a catalog migration is active. Retry before making writes."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
            }}
            data-testid="tenant-migration-status-retry"
          >
            Retry status
          </Button>
        </div>
      ) : null}
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
