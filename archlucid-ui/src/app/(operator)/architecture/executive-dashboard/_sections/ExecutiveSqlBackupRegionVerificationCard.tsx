"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSqlBackupRegionVerificationQuery } from "@/hooks/use-sql-backup-region-verification-query";
import { EXECUTIVE_KPI_DRILL_THROUGH } from "@/lib/executive-kpi-drill-through-hrefs";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  formatSqlBackupPrimaryRegionLabel,
  type SqlBackupRegionVerification,
} from "@/lib/sql-backup-region-verification";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function verificationStatusIcon(verified: boolean) {
  if (verified) {
    return (
      <CheckCircle2
        className="size-8 shrink-0 text-teal-600 dark:text-teal-400"
        aria-hidden
        data-testid="sql-backup-verification-status-verified"
      />
    );
  }

  return (
    <AlertTriangle
      className="size-8 shrink-0 text-amber-600 dark:text-amber-400"
      aria-hidden
      data-testid="sql-backup-verification-status-unverified"
    />
  );
}

function redundancyDetail(verification: SqlBackupRegionVerification): string | null {
  const redundancy = verification.backupStorageRedundancy?.trim();

  if (!redundancy) {
    return null;
  }

  return `Backup storage redundancy: ${redundancy}`;
}

/** Executive dashboard tile — reads persisted Terraform CI verification artifact. */
export function ExecutiveSqlBackupRegionVerificationCard() {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY.sqlBackupRegionVerificationMetric;
  const verificationQuery = useSqlBackupRegionVerificationQuery();
  const verification = verificationQuery.data ?? null;
  const loadFailed = verificationQuery.isError;
  const loading =
    verificationQuery.isPending || (verificationQuery.isFetching && !verificationQuery.isFetched);

  if (loading) {
    return (
      <Card data-testid="executive-sql-backup-region-verification-card">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>{v.title}</CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>{v.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="sql-backup-verification-loading">
            Checking backup status…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (verification === null) {
    return (
      <Card data-testid="executive-sql-backup-region-verification-card">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>{v.title}</CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>{v.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="alert">
            Backup region verification is unavailable right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  const regionLabel = formatSqlBackupPrimaryRegionLabel(verification);
  const redundancyLine = redundancyDetail(verification);
  const statusText = verification.verified
    ? `Verified for ${verification.databaseResourceCount} database resource(s).`
    : "Backup region policy is not verified against the latest Terraform plan.";

  return (
    <Card data-testid="executive-sql-backup-region-verification-card">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_KPI_CARD_TITLE}>{v.title}</CardTitle>
        <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>{v.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex items-start gap-3"
          role="status"
          aria-live="polite"
          data-testid="sql-backup-verification-body"
        >
          {verificationStatusIcon(verification.verified)}
          <div className="min-w-0 space-y-1">
            <Link
              href={EXECUTIVE_KPI_DRILL_THROUGH.sqlBackupRegion}
              data-testid="kpi-tile-sql-backup-region-link"
              className="block rounded-sm text-inherit no-underline outline-none transition-shadow cursor-pointer hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <p
                className={OPERATOR_TYPOGRAPHY.kpiValue}
                data-testid="sql-backup-verification-region-name"
              >
                {regionLabel}
              </p>
            </Link>
            <p
              className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="sql-backup-verification-platform-scope-note"
            >
              {v.platformScopeNote}
            </p>
            {redundancyLine !== null ? (
              <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{redundancyLine}</p>
            ) : null}
            <p
              className={cn(
                verification.verified
                  ? "text-teal-800 dark:text-teal-200"
                  : "text-amber-800 dark:text-amber-200",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              {statusText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
