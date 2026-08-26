"use client";

import { useCallback, useState } from "react";

import { canExportAuditCsv, principalRolesAllowAuditCsvExport } from "@/app/(operator)/governance/audit/audit-ui-helpers";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { downloadAuditExportCsv } from "@/lib/api";

import type { AuditFilterFields } from "./audit-page-helpers";

export type UseAuditPageExportArgs = {
  readonly fromUtc: string;
  readonly toUtc: string;
  readonly currentFilters: () => AuditFilterFields;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
};

export type UseAuditPageExportResult = {
  readonly exporting: boolean;
  readonly exportDateRangeReady: boolean;
  readonly exportRoleOk: boolean;
  readonly csvExportUiAllowed: boolean;
  readonly onExportCsv: () => Promise<void>;
};

export function useAuditPageExport(args: UseAuditPageExportArgs): UseAuditPageExportResult {
  const { fromUtc, toUtc, currentFilters, setFailure } = args;
  const { currentPrincipal } = useOperatorNavAuthority();
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

      await downloadAuditExportCsv({
        fromUtcIso: new Date(fromUtc).toISOString(),
        toUtcIso: new Date(toUtc).toISOString(),
        maxRows: 10_000,
        eventType: filters.eventType.trim() || undefined,
        correlationId: filters.correlationId.trim() || undefined,
        actorUserId: filters.actorUserId.trim() || undefined,
        runId: filters.runId.trim() || undefined,
      });
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setExporting(false);
    }
  }, [currentFilters, currentPrincipal.roleClaimValues, fromUtc, setFailure, toUtc]);

  return {
    exporting,
    exportDateRangeReady,
    exportRoleOk,
    csvExportUiAllowed,
    onExportCsv,
  };
}
