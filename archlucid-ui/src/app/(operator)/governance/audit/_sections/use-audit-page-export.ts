"use client";

import { useCallback, useState } from "react";

import { canExportAuditCsv, principalRolesAllowAuditCsvExport } from "@/app/(operator)/governance/audit/audit-ui-helpers";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { auditExportBlockedReason } from "@/lib/audit/audit-export-blocked-reason";
import {
  resolveAuditExportCareerBlockedReason,
  resolveAuditExportCareerPosture,
  type AuditExportCareerPosture,
} from "@/lib/audit/audit-export-career-posture";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { downloadAuditExportCsv } from "@/lib/api";
import type { RunSummary } from "@/types/authority";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

import type { AuditFilterFields } from "./audit-page-helpers";

export type UseAuditPageExportArgs = {
  readonly fromUtc: string;
  readonly toUtc: string;
  readonly scopedRunId: string;
  readonly currentFilters: () => AuditFilterFields;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
};

export function resolveAuditPageExportCareerContext(input: {
  readonly runId: string;
  readonly progressSummary: RunSummary | null | undefined;
  readonly liveDoor: WorkingCareerRehearsalDoorId;
  readonly workingDesk: boolean;
}): { readonly auditExportPosture: AuditExportCareerPosture | null; readonly blockedReason: string | null } {
  const trimmedRunId = input.runId.trim();

  if (trimmedRunId.length === 0) {
    return { auditExportPosture: null, blockedReason: null };
  }

  const progressSummary = input.progressSummary ?? null;
  const postureInput = {
    progressSummary,
    structuralExecutionMode: progressSummary?.structuralExecutionMode ?? null,
    workingCareerRehearsalDoor: progressSummary?.workingCareerRehearsalDoor ?? null,
    liveDoor: input.liveDoor,
  };

  if (input.workingDesk) {
    const blockedReason = resolveAuditExportCareerBlockedReason({
      runId: trimmedRunId,
      ...postureInput,
      enginesSucceeded: null,
    });

    if (blockedReason !== null) {
      return { auditExportPosture: null, blockedReason };
    }
  }

  return {
    auditExportPosture: resolveAuditExportCareerPosture(postureInput),
    blockedReason: null,
  };
}

export type UseAuditPageExportResult = {
  readonly exporting: boolean;
  readonly exportDateRangeReady: boolean;
  readonly exportRoleOk: boolean;
  readonly csvExportUiAllowed: boolean;
  readonly onExportCsv: () => Promise<void>;
};

export function useAuditPageExport(args: UseAuditPageExportArgs): UseAuditPageExportResult {
  const { fromUtc, toUtc, scopedRunId, currentFilters, setFailure } = args;
  const { currentPrincipal } = useOperatorNavAuthority();
  const { isWorkingMode } = useWorkspaceMode();
  const { effectiveDoor } = useEffectiveWorkingCareerRehearsalDoor();
  const runSummaryQuery = useRunSummaryQuery(scopedRunId, { enabled: scopedRunId.trim().length > 0 });
  const [exporting, setExporting] = useState(false);

  const exportDateRangeReady = canExportAuditCsv(fromUtc, toUtc);
  const exportRoleOk = principalRolesAllowAuditCsvExport(currentPrincipal.roleClaimValues);
  const csvExportUiAllowed = exportDateRangeReady && exportRoleOk;

  const onExportCsv = useCallback(async () => {
    if (!canExportAuditCsv(fromUtc, toUtc) || !principalRolesAllowAuditCsvExport(currentPrincipal.roleClaimValues)) {
      return;
    }

    setExporting(true);
    setFailure(null);

    try {
      const filters = currentFilters();
      const runId = filters.runId.trim();
      const { auditExportPosture, blockedReason } = resolveAuditPageExportCareerContext({
        runId,
        progressSummary: runSummaryQuery.data,
        liveDoor: effectiveDoor,
        workingDesk: isWorkingMode,
      });

      if (blockedReason !== null) {
        setFailure({
          message: blockedReason,
          problem: null,
          correlationId: null,
          httpStatus: null,
          retryAfterSeconds: null,
        });

        return;
      }

      await downloadAuditExportCsv({
        fromUtcIso: new Date(fromUtc).toISOString(),
        toUtcIso: new Date(toUtc).toISOString(),
        maxRows: 10_000,
        eventType: filters.eventType.trim() || undefined,
        correlationId: filters.correlationId.trim() || undefined,
        actorUserId: filters.actorUserId.trim() || undefined,
        runId: runId.length > 0 ? runId : undefined,
        auditExportPosture,
      });
    } catch (e) {
      const failure = toApiLoadFailure(e);
      const blockedReason = auditExportBlockedReason(failure);

      setFailure(
        blockedReason !== null
          ? { ...failure, message: blockedReason }
          : failure,
      );
    } finally {
      setExporting(false);
    }
  }, [
    currentFilters,
    currentPrincipal.roleClaimValues,
    effectiveDoor,
    fromUtc,
    isWorkingMode,
    runSummaryQuery.data,
    setFailure,
    toUtc,
  ]);

  return {
    exporting,
    exportDateRangeReady,
    exportRoleOk,
    csvExportUiAllowed,
    onExportCsv,
  };
}
