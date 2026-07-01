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

export type DecisionReceiptExportButtonProps = {
  readonly context: DecisionReceiptContext;
  readonly disabled?: boolean;
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

  if (serverDownloadUrl !== null) {
    return (
      <Button variant="outline" size="sm" disabled={props.disabled === true} asChild>
        <ExportTrackedAnchor href={serverDownloadUrl} data-testid="decision-receipt-export">
          Download decision receipt (JSON)
        </ExportTrackedAnchor>
      </Button>
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
