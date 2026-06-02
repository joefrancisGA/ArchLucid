"use client";

import { AzureExtractorUploadFailureCallout } from "@/components/AzureExtractorUploadFailureCallout";
import { Button } from "@/components/ui/button";
import type { ApiProblemDetails } from "@/lib/api-problem";

export type WizardEvidenceUploadTrackState = "idle" | "uploading" | "success" | "failed";

export type WizardPostCreateEvidenceUploadPanelProps = {
  pendingFile: File | null;
  uploadState: WizardEvidenceUploadTrackState;
  uploadError: {
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null;
  onRetry: () => void;
};

/** Inline upload status on the pipeline step after review creation (TB-215). */
export function WizardPostCreateEvidenceUploadPanel(props: WizardPostCreateEvidenceUploadPanelProps) {
  const { pendingFile, uploadState, uploadError, onRetry } = props;

  if (pendingFile === null && uploadState !== "success" && uploadState !== "failed") {
    return null;
  }

  if (uploadState === "success") {
    return (
      <p
        className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100"
        data-testid="wizard-evidence-upload-success"
      >
        Azure evidence uploaded and linked to this review.
      </p>
    );
  }

  if (uploadState === "uploading") {
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400" data-testid="wizard-evidence-upload-uploading">
        Uploading Azure evidence…
      </p>
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
        {pendingFile !== null ? (
          <Button type="button" variant="secondary" data-testid="wizard-evidence-upload-retry" onClick={onRetry}>
            Retry evidence upload
          </Button>
        ) : null}
      </div>
    );
  }

  return null;
}
