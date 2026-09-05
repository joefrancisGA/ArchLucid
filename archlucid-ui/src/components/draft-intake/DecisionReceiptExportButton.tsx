"use client";

import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { Button } from "@/components/ui/button";
import {
  getDraftDecisionReceiptDownloadUrl,
  getRunDecisionReceiptDownloadUrl,
} from "@/lib/api/downloads-api";
import {
  type DecisionReceiptContext,
  triggerDecisionReceiptDownload,
} from "@/lib/decision-receipt-export";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DecisionReceiptExportButtonProps = {
  readonly context: DecisionReceiptContext;
  readonly disabled?: boolean;
  readonly manifestVersion?: string | null;
};

function resolveServerDownloadUrl(context: DecisionReceiptContext): string | null {
  if (context.runId !== undefined && context.runId.trim().length > 0) {
    return getRunDecisionReceiptDownloadUrl(context.runId.trim());
  }

  if (context.draftId !== undefined && context.draftId.trim().length > 0) {
    return getDraftDecisionReceiptDownloadUrl(context.draftId.trim());
  }

  return null;
}

/** Downloads the ADR 0052 decision receipt JSON (server-audited when draft/run id is present). */
export function DecisionReceiptExportButton(props: DecisionReceiptExportButtonProps) {
  const serverDownloadUrl = resolveServerDownloadUrl(props.context);
  const runId = props.context.runId?.trim() ?? "";
  const sealedManifestBlockedReason =
    runId.length > 0
      ? runCollateralSealedManifestCopyBlockedReason({
          runId,
          manifestVersion: props.manifestVersion,
        })
      : null;

  if (serverDownloadUrl !== null) {
    const exportBlocked = sealedManifestBlockedReason !== null;

    return (
      <div className="flex flex-col gap-1">
        <Button variant="outline" size="sm" disabled={props.disabled === true || exportBlocked} asChild={!exportBlocked}>
          {exportBlocked ? (
            <span data-testid="decision-receipt-export">Download decision receipt (JSON)</span>
          ) : (
            <ExportTrackedAnchor href={serverDownloadUrl} data-testid="decision-receipt-export">
              Download decision receipt (JSON)
            </ExportTrackedAnchor>
          )}
        </Button>
        {exportBlocked ? (
          <p
            role="alert"
            className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="decision-receipt-export-blocked-reason"
          >
            {sealedManifestBlockedReason}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={props.disabled === true}
      data-testid="decision-receipt-export"
      onClick={() => {
        triggerDecisionReceiptDownload(props.context);
      }}
    >
      Download decision receipt (JSON)
    </Button>
  );
}
