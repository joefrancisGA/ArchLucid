"use client";

import { Button } from "@/components/ui/button";
import { downloadRunDecisionReceiptJson } from "@/lib/api/downloads-blob-trigger-decision-receipt";
import { downloadDraftDecisionReceiptJson } from "@/lib/api/downloads-blob-trigger-draft-decision-receipt";
import {
  type DecisionReceiptContext,
  resolveDecisionReceiptExportBlockedReason,
  triggerDecisionReceiptDownload,
} from "@/lib/decision-receipt-export";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { showError } from "@/lib/toast";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DecisionReceiptExportButtonProps = {
  readonly context: DecisionReceiptContext;
  readonly disabled?: boolean;
  readonly manifestVersion?: string | null;
};

/** Downloads the ADR 0052 decision receipt JSON (server-audited when draft/run id is present). */
export function DecisionReceiptExportButton(props: DecisionReceiptExportButtonProps) {
  const runId = props.context.runId?.trim() ?? "";
  const draftId = props.context.draftId?.trim() ?? "";
  const citationBlockedReason = resolveDecisionReceiptExportBlockedReason(props.context);
  const sealedManifestBlockedReason =
    runId.length > 0
      ? runCollateralSealedManifestCopyBlockedReason({
          runId,
          manifestVersion: props.manifestVersion,
        })
      : null;
  const exportBlockedReason = citationBlockedReason ?? sealedManifestBlockedReason;

  if (runId.length > 0) {
    const exportBlocked = exportBlockedReason !== null;

    return (
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.disabled === true || exportBlocked}
          data-testid="decision-receipt-export"
          onClick={() => {
            if (exportBlocked) {
              return;
            }

            void downloadRunDecisionReceiptJson(runId).catch((error: unknown) => {
              showError(
                "Decision receipt",
                error instanceof Error ? error.message : "Download failed.",
              );
            });
          }}
        >
          Download decision receipt (JSON)
        </Button>
        {exportBlocked ? (
          <p
            role="alert"
            className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="decision-receipt-export-blocked-reason"
          >
            {exportBlockedReason}
          </p>
        ) : null}
      </div>
    );
  }

  if (draftId.length > 0) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={props.disabled === true}
        data-testid="decision-receipt-export"
        onClick={() => {
          void downloadDraftDecisionReceiptJson(draftId).catch((error: unknown) => {
            showError(
              "Decision receipt",
              error instanceof Error ? error.message : "Download failed.",
            );
          });
        }}
      >
        Download decision receipt (JSON)
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={props.disabled === true || citationBlockedReason !== null}
        data-testid="decision-receipt-export"
        onClick={() => {
          triggerDecisionReceiptDownload(props.context);
        }}
      >
        Download decision receipt (JSON)
      </Button>
      {citationBlockedReason !== null ? (
        <p
          role="alert"
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="decision-receipt-export-blocked-reason"
        >
          {citationBlockedReason}
        </p>
      ) : null}
    </div>
  );
}
