"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useState } from "react";

import { AuditDualChannelHonestyNote } from "@/components/audit/AuditDualChannelHonestyNote";
import { principalRolesAllowAuditCsvExport } from "@/app/(operator)/governance/audit/audit-ui-helpers";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { downloadAuditExportCsv } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { auditExportBlockedReason } from "@/lib/audit/audit-export-blocked-reason";
import {
  resolveAuditExportCareerBlockedReason,
  resolveAuditExportCareerPosture,
} from "@/lib/audit/audit-export-career-posture";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { auditExportExecuteRankAuditorRoleNote } from "@/lib/enterprise-controls-context-copy";
import { buildRunScopedAuditExportParams } from "@/lib/runs/run-scoped-audit-export";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import { showError } from "@/lib/toast";
import type { RunSummary } from "@/types/authority";

export type RunScopedAuditExportButtonProps = {
  readonly runId: string;
  readonly manifestVersion?: string | null;
  readonly progressSummary?: RunSummary | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
  readonly liveDoor?: WorkingCareerRehearsalDoorId | null;
  readonly enginesSucceeded?: number | null;
};

/** One-click run-scoped audit CSV export from review detail (Requires Auditor or Admin on API). */
export function RunScopedAuditExportButton(props: RunScopedAuditExportButtonProps): React.JSX.Element | null {
  const {
    runId,
    manifestVersion = null,
    progressSummary = null,
    structuralExecutionMode,
    workingCareerRehearsalDoor,
    liveDoor,
    enginesSucceeded = null,
  } = props;
  const { currentPrincipal } = useOperatorNavAuthority();
  const [busy, setBusy] = useState(false);
  const [roleHintVisible, setRoleHintVisible] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const exportRoleOk = principalRolesAllowAuditCsvExport(currentPrincipal.roleClaimValues);
  const trimmedRunId = runId.trim();
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: trimmedRunId,
    manifestVersion,
  });

  const onExport = useCallback(async (): Promise<void> => {
    if (sealedManifestBlockedReason !== null) {
      setBlockedReason(sealedManifestBlockedReason);
      return;
    }

    if (!exportRoleOk) {
      setRoleHintVisible(true);

      return;
    }

    const careerBlockedReason = resolveAuditExportCareerBlockedReason({
      runId: trimmedRunId,
      progressSummary,
      structuralExecutionMode,
      workingCareerRehearsalDoor,
      liveDoor,
      enginesSucceeded,
    });

    if (careerBlockedReason !== null) {
      setBlockedReason(careerBlockedReason);

      return;
    }

    setBusy(true);
    setRoleHintVisible(false);
    setBlockedReason(null);

    try {
      const params = buildRunScopedAuditExportParams(trimmedRunId);
      const auditExportPosture = resolveAuditExportCareerPosture({
        progressSummary,
        structuralExecutionMode,
        workingCareerRehearsalDoor,
        liveDoor,
      });

      await downloadAuditExportCsv({
        ...params,
        auditExportPosture,
      });
    } catch (error: unknown) {
      if (isApiRequestError(error) && error.httpStatus === 403) {
        setRoleHintVisible(true);
      }

      const failure = toApiLoadFailure(error);
      const blockedReason = auditExportBlockedReason(failure);

      if (blockedReason !== null) {
        setBlockedReason(blockedReason);
      }

      const message = blockedReason ?? (error instanceof Error ? error.message : "Audit export failed.");

      showError("Audit export", message);
    } finally {
      setBusy(false);
    }
  }, [
    enginesSucceeded,
    exportRoleOk,
    liveDoor,
    manifestVersion,
    progressSummary,
    sealedManifestBlockedReason,
    structuralExecutionMode,
    trimmedRunId,
    workingCareerRehearsalDoor,
  ]);

  if (trimmedRunId.length === 0) {
    return null;
  }

  if (!exportRoleOk && currentPrincipal.primaryAppRole === "Reader") {
    return null;
  }

  return (
    <div className="flex flex-col gap-1" data-testid="run-scoped-audit-export">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || !exportRoleOk || sealedManifestBlockedReason !== null}
        data-testid="run-scoped-audit-export-button"
        aria-describedby={
          roleHintVisible || !exportRoleOk ? "run-scoped-audit-export-role-hint" : undefined
        }
        onClick={() => void onExport()}
      >
        {busy ? "Exporting audit trail…" : "Download audit trail (CSV)"}
      </Button>
      {sealedManifestBlockedReason !== null ? (
        <p
          role="alert"
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-scoped-audit-export-blocked-reason"
        >
          {sealedManifestBlockedReason}
        </p>
      ) : blockedReason !== null ? (
        <p
          role="alert"
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-scoped-audit-export-blocked-reason"
        >
          {blockedReason}
        </p>
      ) : null}
      {roleHintVisible || !exportRoleOk ? (
        <p
          id="run-scoped-audit-export-role-hint"
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-scoped-audit-export-role-hint"
        >
          {auditExportExecuteRankAuditorRoleNote} Requires Auditor or Admin role for CSV export.
        </p>
      ) : null}
      <div data-testid="run-scoped-audit-export-dual-channel-honesty">
        <AuditDualChannelHonestyNote className="mt-1" />
      </div>
    </div>
  );
}
