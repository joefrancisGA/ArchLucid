"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { FileJson, FileSpreadsheet } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadRunFindingsCsv } from "@/lib/api";
import { downloadRunFindingsItsmJsonExport } from "@/lib/run-findings-itsm-export";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { showError } from "@/lib/toast";

export type FindingsItsmExportToolbarProps = {
  runId: string;
  findings: readonly QuickDecisionFinding[];
};

/**
 * Prominent CSV + JSON export seam for Jira/ServiceNow workflows until native connectors ship.
 */
export function FindingsItsmExportToolbar({ runId, findings }: FindingsItsmExportToolbarProps) {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const onExportCsv = useCallback(async () => {
    setExportingCsv(true);
    setExportError(null);

    try {
      await downloadRunFindingsCsv(runId);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "CSV export failed.");
    } finally {
      setExportingCsv(false);
    }
  }, [runId]);

  const onExportJson = useCallback(() => {
    setExportError(null);

    try {
      const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
      downloadRunFindingsItsmJsonExport(runId, findings, siteOrigin);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "JSON export failed.");
    }
  }, [findings, runId]);

  if (findings.length === 0) {
    return null;
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
        Download all findings, or use <strong>Copy for Jira</strong> on each row for one-click paste into a ticket.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          className={cn("h-8 gap-1.5", OPERATOR_TYPOGRAPHY.helper)}
          disabled={exportingCsv}
          data-testid="findings-export-csv-button"
          onClick={() => {
            void onExportCsv();
          }}
        >
          <FileSpreadsheet className="size-3.5" aria-hidden />
          {exportingCsv ? "Exporting…" : "Export CSV"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1.5", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="findings-export-json-button"
          onClick={onExportJson}
        >
          <FileJson className="size-3.5" aria-hidden />
          Export JSON (work items)
        </Button>
      </div>
      {exportError !== null ? (
        <p className={cn("m-0 mt-2 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
