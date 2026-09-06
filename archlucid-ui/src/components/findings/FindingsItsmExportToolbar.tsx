"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FileJson, FileSpreadsheet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SimulatorModeAiOperationNotice } from "@/components/usability/SimulatorModeAiOperationNotice";
import {
  downloadQuickDecisionFindingsCsv,
  downloadRunFindingsItsmJsonExport,
  PRE_FINALIZE_FINDINGS_EXPORT_MARKER,
} from "@/lib/runs/run-findings-itsm-export";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  findingsItsmPreFinalizeExportDisclosureHrefFromSearch,
  parseFindingsItsmPreFinalizeExportOpenFromSearch,
} from "@/lib/findings/findings-itsm-pre-finalize-export-disclosure-url";

export type FindingsItsmExportToolbarProps = {
  runId: string;
  findings: readonly QuickDecisionFinding[];
  /** Sealed manifest version token for export guard when package is committed. */
  manifestVersionForExportGuard?: string | null;
  /** When filters hide rows, total before the confidence gate (for scope labels). */
  totalFindingCount?: number;
  /** Compact toolbar row for the findings workspace header. */
  compact?: boolean;
  /** When false, demote export behind disclosure with pre-finalize qualifier. */
  packageCommitted?: boolean;
};

function resolveExportScopeLabel(
  shownCount: number,
  totalCount: number | undefined,
  hiddenAdvisoryCount: number,
): string | null {
  if (hiddenAdvisoryCount > 0) {
    return `Exporting ${shownCount} rendered card${shownCount === 1 ? "" : "s"} — ${hiddenAdvisoryCount} advisory note${hiddenAdvisoryCount === 1 ? "" : "s"} collapsed`;
  }

  if (totalCount === undefined || totalCount <= shownCount) {
    return null;
  }

  return `Exporting ${shownCount} shown of ${totalCount} matching findings`;
}

/**
 * Prominent CSV + JSON export seam for Jira/ServiceNow workflows until native connectors ship.
 */
export function FindingsItsmExportToolbar({
  runId,
  findings,
  manifestVersionForExportGuard,
  totalFindingCount,
  compact = false,
  packageCommitted,
}: FindingsItsmExportToolbarProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const findingsItsmPreFinalizeExportOpenParam = searchParams.get("findingsItsmPreFinalizeExportOpen");
  const [preFinalizeExportOpen, setPreFinalizeExportOpenState] = useState(() =>
    parseFindingsItsmPreFinalizeExportOpenFromSearch(findingsItsmPreFinalizeExportOpenParam),
  );
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const sealedManifestBlockedReason =
    packageCommitted === true
      ? runCollateralSealedManifestCopyBlockedReason({
          runId,
          manifestVersion: manifestVersionForExportGuard,
        })
      : null;
  const hiddenAdvisoryCount = Math.max(0, (totalFindingCount ?? findings.length) - findings.length);
  const scopeLabel = resolveExportScopeLabel(findings.length, totalFindingCount, hiddenAdvisoryCount);
  const exportOptions = packageCommitted === false ? { packageCommitted: false as const } : undefined;
  const csvLabel =
    hiddenAdvisoryCount > 0
      ? `Export ${findings.length} rendered CSV`
      : totalFindingCount !== undefined && totalFindingCount > findings.length
        ? `Export ${findings.length} shown CSV`
        : `Export ${findings.length} CSV`;
  const jsonLabel =
    hiddenAdvisoryCount > 0
      ? `Export ${findings.length} rendered JSON`
      : totalFindingCount !== undefined && totalFindingCount > findings.length
        ? `Export ${findings.length} shown JSON`
        : `Export ${findings.length} JSON`;

  const onExportCsv = useCallback(() => {
    if (sealedManifestBlockedReason !== null) {
      setExportError(sealedManifestBlockedReason);
      return;
    }

    setExportingCsv(true);
    setExportError(null);

    try {
      downloadQuickDecisionFindingsCsv(runId, findings, exportOptions);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "CSV export failed.");
    } finally {
      setExportingCsv(false);
    }
  }, [exportOptions, findings, runId, sealedManifestBlockedReason]);

  const onExportJson = useCallback(() => {
    if (sealedManifestBlockedReason !== null) {
      setExportError(sealedManifestBlockedReason);
      return;
    }

    setExportError(null);

    try {
      const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
      downloadRunFindingsItsmJsonExport(runId, findings, siteOrigin, exportOptions);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "JSON export failed.");
    }
  }, [exportOptions, findings, runId, sealedManifestBlockedReason]);

  const syncPreFinalizeExportOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        findingsItsmPreFinalizeExportDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPreFinalizeExportOpen = useCallback(
    (open: boolean) => {
      setPreFinalizeExportOpenState(open);
      syncPreFinalizeExportOpenToUrl(open);
    },
    [syncPreFinalizeExportOpenToUrl],
  );

  useEffect(() => {
    setPreFinalizeExportOpenState(
      parseFindingsItsmPreFinalizeExportOpenFromSearch(findingsItsmPreFinalizeExportOpenParam),
    );
  }, [findingsItsmPreFinalizeExportOpenParam]);

  if (findings.length === 0) {
    return null;
  }

  const exportButtons = (
    <div
      className="flex flex-wrap items-center justify-end gap-2"
      role="group"
      aria-label="Export findings"
    >
      {scopeLabel !== null ? (
        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {scopeLabel}
        </span>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        disabled={exportingCsv || sealedManifestBlockedReason !== null}
        data-testid="findings-export-csv-button"
        onClick={onExportCsv}
      >
        <FileSpreadsheet className="size-3.5" aria-hidden />
        {exportingCsv ? "Exporting…" : csvLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        disabled={sealedManifestBlockedReason !== null}
        data-testid="findings-export-json-button"
        onClick={onExportJson}
      >
        <FileJson className="size-3.5" aria-hidden />
        {jsonLabel}
      </Button>
      {exportError !== null ? (
        <p className={cn("m-0 w-full text-right text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );

  if (packageCommitted === false) {
    return (
      <details
        className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
        data-testid="findings-itsm-export-toolbar"
        data-workspace-disclosure
        open={preFinalizeExportOpen}
        onToggle={(event) => {
          setPreFinalizeExportOpen((event.currentTarget as HTMLDetailsElement).open);
        }}
      >
        <summary className={cn("cursor-pointer font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          Export findings before finalize
        </summary>
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {PRE_FINALIZE_FINDINGS_EXPORT_MARKER}
        </p>
        <div className="mt-2 space-y-2">
          <SimulatorModeAiOperationNotice testId="findings-export-simulator-notice" />
          {exportButtons}
        </div>
      </details>
    );
  }

  if (compact) {
    return (
      <div data-testid="findings-itsm-export-toolbar" className="space-y-2">
        <SimulatorModeAiOperationNotice testId="findings-export-simulator-notice" />
        {exportButtons}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50/90 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="findings-itsm-export-toolbar"
    >
      <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        Export for Jira / ServiceNow
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {scopeLabel ?? `Download ${findings.length} finding${findings.length === 1 ? "" : "s"}, or use `}
        {scopeLabel === null ? (
          <>
            <strong>Copy for Jira</strong> on each row for one-click paste into a ticket.
          </>
        ) : null}
      </p>
      <div className="mt-2 space-y-2">
        <SimulatorModeAiOperationNotice testId="findings-export-simulator-notice" />
        <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-8 gap-1.5"
          disabled={exportingCsv || sealedManifestBlockedReason !== null}
          data-testid="findings-export-csv-button"
          onClick={onExportCsv}
        >
          <FileSpreadsheet className="size-3.5" aria-hidden />
          {exportingCsv ? "Exporting…" : csvLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          disabled={sealedManifestBlockedReason !== null}
          data-testid="findings-export-json-button"
          onClick={onExportJson}
        >
          <FileJson className="size-3.5" aria-hidden />
          {jsonLabel}
        </Button>
        </div>
      </div>
      {exportError !== null ? (
        <p className={cn("m-0 mt-2 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
