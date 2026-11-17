"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { AzureExtractorUploadFailureCallout } from "@/components/AzureExtractorUploadFailureCallout";
import { AzureExtractorUploadProgressBar } from "@/components/AzureExtractorUploadProgressBar";
import { Button } from "@/components/ui/button";
import type { ApiProblemDetails } from "@/lib/api-problem";

export type WizardEvidenceUploadTrackState = "idle" | "uploading" | "success" | "failed";

export type WizardPostCreateEvidenceUploadPanelProps = {
  pendingFile: File | null;
  pendingDocumentFileCount: number;
  uploadState: WizardEvidenceUploadTrackState;
  uploadProgressPercent?: number | null;
  uploadError: {
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null;
  onRetry: () => void;
};

/** Inline upload status on the pipeline step after review creation (TB-215). */
export function WizardPostCreateEvidenceUploadPanel(props: WizardPostCreateEvidenceUploadPanelProps) {
  const {
    pendingFile,
    pendingDocumentFileCount,
    uploadState,
    uploadProgressPercent,
    uploadError,
    onRetry,
  } = props;
  const hasPendingUpload = pendingFile !== null || pendingDocumentFileCount > 0;

  if (!hasPendingUpload && uploadState !== "success" && uploadState !== "failed") {
    return null;
  }

  if (uploadState === "success") {
    const uploadedFileName = pendingFile?.name?.trim() ?? "";

    return (
      <p
        className={cn("rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.body)}
        data-testid="wizard-evidence-upload-success"
      >
        Upload finished for {uploadedFileName.length > 0 ? uploadedFileName : "the selected file"}. It is linked to
        this review but was not parsed into the diagram yet.
      </p>
    );
  }

  if (uploadState === "uploading") {
    return (
      <AzureExtractorUploadProgressBar
        label="Uploading the selected file. This is not yet a stored architecture package."
        percent={uploadProgressPercent}
        testId="wizard-evidence-upload-uploading"
      />
    );
  }

  if (uploadState === "failed" && uploadError !== null) {
    return (
      <div className="space-y-3" data-testid="wizard-evidence-upload-failure">
        <AzureExtractorUploadFailureCallout
          problem={uploadError.problem}
          fallbackMessage={uploadError.message}
          correlationId={uploadError.correlationId}
        />
        {hasPendingUpload ? (
          <Button type="button" variant="secondary" data-testid="wizard-evidence-upload-retry" onClick={onRetry}>
            Retry evidence upload
          </Button>
        ) : null}
      </div>
    );
  }

  return null;
}
