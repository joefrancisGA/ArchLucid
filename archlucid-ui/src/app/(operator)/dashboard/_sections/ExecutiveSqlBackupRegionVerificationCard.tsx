import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import {
  formatSqlBackupPrimaryRegionLabel,
  loadSqlBackupRegionVerification,
  type SqlBackupRegionVerification,
} from "@/lib/sql-backup-region-verification";

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
export async function ExecutiveSqlBackupRegionVerificationCard() {
  const verification = await loadSqlBackupRegionVerification();
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY.sqlBackupRegionVerificationMetric;
  const regionLabel = formatSqlBackupPrimaryRegionLabel(verification);
  const redundancyLine = redundancyDetail(verification);
  const statusText = verification.verified
    ? `Verified for ${verification.databaseResourceCount} database resource(s).`
    : "Backup region policy is not verified against the latest Terraform plan.";

  return (
    <Card data-testid="executive-sql-backup-region-verification-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{v.title}</CardTitle>
        <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">{v.description}</CardDescription>
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
            <p
              className="font-mono text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50"
              data-testid="sql-backup-verification-region-name"
            >
              {regionLabel}
            </p>
            {redundancyLine !== null ? (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">{redundancyLine}</p>
            ) : null}
            <p
              className={
                verification.verified
                  ? "text-xs text-teal-800 dark:text-teal-200"
                  : "text-xs text-amber-800 dark:text-amber-200"
              }
            >
              {statusText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
