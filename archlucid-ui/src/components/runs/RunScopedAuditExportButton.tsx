"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useState } from "react";

import { principalRolesAllowAuditCsvExport } from "@/app/(operator)/governance/audit/audit-ui-helpers";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { downloadAuditExportCsv } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  auditExportCsvButtonLabelRoleRestricted,
  auditExportExecuteRankAuditorRoleNote,
} from "@/lib/enterprise-controls-context-copy";
import { buildRunScopedAuditExportParams } from "@/lib/runs/run-scoped-audit-export";
import { showError } from "@/lib/toast";

export type RunScopedAuditExportButtonProps = {
  readonly runId: string;
};

/** One-click run-scoped audit CSV export from review detail (Requires Auditor or Admin on API). */
export function RunScopedAuditExportButton(props: RunScopedAuditExportButtonProps): React.JSX.Element | null {
  const { runId } = props;
  const { currentPrincipal } = useOperatorNavAuthority();
  const [busy, setBusy] = useState(false);
  const [roleHintVisible, setRoleHintVisible] = useState(false);

  const exportRoleOk = principalRolesAllowAuditCsvExport(currentPrincipal.roleClaimValues);
  const trimmedRunId = runId.trim();

  const onExport = useCallback(async (): Promise<void> => {
    if (!exportRoleOk) {
      setRoleHintVisible(true);

      return;
    }

    setBusy(true);
    setRoleHintVisible(false);

    try {
      const params = buildRunScopedAuditExportParams(trimmedRunId);

      await downloadAuditExportCsv(params);
    } catch (error: unknown) {
      if (isApiRequestError(error) && error.httpStatus === 403) {
        setRoleHintVisible(true);
      }

      const message = error instanceof Error ? error.message : "Audit export failed.";

      showError("Audit export", message);
    } finally {
      setBusy(false);
    }
  }, [exportRoleOk, trimmedRunId]);

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
        disabled={busy || !exportRoleOk}
        data-testid="run-scoped-audit-export-button"
        title={
          exportRoleOk
            ? "Download audit trail (CSV) for this review"
            : auditExportCsvButtonLabelRoleRestricted
        }
        onClick={() => void onExport()}
      >
        {busy ? "Exporting audit trail…" : "Download audit trail (CSV)"}
      </Button>
      {roleHintVisible || !exportRoleOk ? (
        <p
          className={cn("m-0 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-scoped-audit-export-role-hint"
        >
          {auditExportExecuteRankAuditorRoleNote} Requires Auditor or Admin role for CSV export.
        </p>
      ) : null}
    </div>
  );
}
