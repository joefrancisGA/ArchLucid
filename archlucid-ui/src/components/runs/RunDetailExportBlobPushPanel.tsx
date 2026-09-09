"use client";

import type { ReactElement } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRunExportBlobPushMutation } from "@/hooks/use-run-export-blob-push-mutation";
import { OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailExportBlobPushPanelProps = {
  readonly runId: string;
  readonly disabled?: boolean;
};

/** TB-2075: enqueue durable run-export ZIP push to a customer Azure Blob SAS URL. */
export function RunDetailExportBlobPushPanel(props: RunDetailExportBlobPushPanelProps): ReactElement {
  const { runId, disabled = false } = props;
  const [destinationSasUrl, setDestinationSasUrl] = useState("");
  const { busy, blockedReason, errorMessage, accepted, pushExport, reset } = useRunExportBlobPushMutation(runId);
  const panelDisabled = disabled || busy;
  const inlineMessage = blockedReason ?? errorMessage;

  return (
    <div
      className={cn("mt-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800", OPERATOR_SHORT_HELPER_MEASURE_CLASS)}
      data-testid="run-detail-export-blob-push-panel"
    >
      <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Push review export to Azure Blob</h4>
      <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Provide a write-capable SAS URL. ArchLucid enqueues a durable background push and returns immediately when accepted.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          value={destinationSasUrl}
          aria-label="Destination SAS URL"
          placeholder="https://account.blob.core.windows.net/container/export.zip?sv=…"
          disabled={panelDisabled}
          data-testid="run-detail-export-blob-push-sas-input"
          onChange={(event) => {
            setDestinationSasUrl(event.target.value);
            reset();
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={panelDisabled || destinationSasUrl.trim().length === 0}
          data-testid="run-detail-export-blob-push-submit"
          onClick={() => {
            void pushExport(destinationSasUrl);
          }}
        >
          {busy ? "Enqueueing…" : "Push export"}
        </Button>
      </div>
      {accepted ? (
        <p
          className={cn("mt-2 text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-export-blob-push-accepted"
          role="status"
        >
          Export push accepted. Track completion in audit events for this review.
        </p>
      ) : null}
      {inlineMessage !== null ? (
        <p
          className={cn("mt-2 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-export-blob-push-blocked-reason"
          role="alert"
        >
          {inlineMessage}
        </p>
      ) : null}
    </div>
  );
}
