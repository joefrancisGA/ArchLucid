"use client";
import { cn } from "@/lib/utils";
import {
  CTA_WIDTH,
  OPERATOR_CALLOUT_SUCCESS_CLASS,
  OPERATOR_CALLOUT_WARN_CLASS,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

import React from "react";
import { AlertCircle, CheckCircle2, UploadCloud } from "lucide-react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import {
  BULK_EVIDENCE_UPLOAD_CANCEL_RECOVERY,
  BULK_EVIDENCE_UPLOAD_FAILURE_RECOVERY,
  BULK_EVIDENCE_UPLOAD_MAX_FILES,
  RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE,
} from "@/lib/bulk-evidence-upload-copy";
import type { BulkEvidenceUploadSummary } from "@/lib/bulk-evidence-upload-outcome";

import { Button } from "./ui/button";
import { FolderAwareFileInput } from "@/components/FolderAwareFileInput";
import { BulkEvidenceFileList } from "@/components/BulkEvidenceFileList";
import { BulkEvidenceUploadProgress } from "@/components/BulkEvidenceUploadProgress";
import { type BulkEvidenceUploadError, useBulkEvidenceUpload } from "@/components/use-bulk-evidence-upload";

export interface BulkEvidenceUploadProps {
  runId: string;
  /** When true, renders body only — parent owns card chrome and heading. */
  embedded?: boolean;
  readonly onUploadSummary?: (summary: BulkEvidenceUploadSummary) => void;
}

function recoveryPresentationForError(error: BulkEvidenceUploadError) {
  if (error.kind === "canceled") {
    return BULK_EVIDENCE_UPLOAD_CANCEL_RECOVERY;
  }

  return BULK_EVIDENCE_UPLOAD_FAILURE_RECOVERY;
}

/**
 * Bulk evidence upload for a review run (`POST /v1/architecture/review/{runId}/evidence/bulk`).
 * @see `BulkEvidenceUpload.test.tsx`
 */
export function BulkEvidenceUpload({ runId, embedded = false, onUploadSummary }: BulkEvidenceUploadProps) {
  const {
    files,
    error,
    uploading,
    progressPercent,
    etaLabel,
    uploadSummary,
    inputRef,
    folderInputRef,
    isMaxFilesBlocked,
    showProgress,
    uploadButtonLabel,
    handleFiles,
    onDrop,
    onDragOver,
    removeFile,
    cancelUpload,
    uploadFiles,
  } = useBulkEvidenceUpload(runId, onUploadSummary);

  const body = (
    <div className={embedded ? "space-y-4" : "space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"}>
      {!embedded ? (
        <>
          <h3 className={cn("m-0 text-lg font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE}
          </h3>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Upload up to {BULK_EVIDENCE_UPLOAD_MAX_FILES} files per action. ZIP archives are expanded automatically (up
            to 1 000 entries each).
          </p>
        </>
      ) : null}

      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-al-surface-raised p-6 dark:border-neutral-700"
        onDrop={onDrop}
        onDragOver={onDragOver}
        data-testid="bulk-evidence-drop-zone"
      >
        <UploadCloud className="mb-2 h-8 w-8 text-neutral-400" aria-hidden />
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Drag files here</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button type="button" variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            Select files
            <input
              type="file"
              multiple
              className="hidden"
              ref={inputRef}
              data-testid="evidence-file-input"
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(e.target.files);
                }

                e.target.value = "";
              }}
              aria-describedby={error !== null ? "upload-error" : undefined}
            />
          </label>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            Select folder
            <FolderAwareFileInput
              multiple
              className="hidden"
              folderSelection
              ref={folderInputRef}
              data-testid="evidence-folder-input"
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(e.target.files);
                }

                e.target.value = "";
              }}
              aria-describedby={error !== null ? "upload-error" : undefined}
            />
          </label>
        </Button>
      </div>

      <div aria-live="polite" className="sr-only">
        {files.length} out of {BULK_EVIDENCE_UPLOAD_MAX_FILES} files selected
      </div>

      <div className={cn("flex items-center justify-between font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        <span>
          {files.length} / {BULK_EVIDENCE_UPLOAD_MAX_FILES} files
        </span>
      </div>

      {error !== null ? (
        <div id="upload-error" data-testid="bulk-evidence-upload-error">
          {error.kind === "max-files" ? (
            <p
              role="alert"
              data-testid="bulk-evidence-upload-error-message"
              className={cn(
                "m-0 whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100",
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {error.userMessage}
            </p>
          ) : (
            <>
              <OperatorMutationInlineError
                message={error.userMessage}
                testId="bulk-evidence-upload-error-message"
                recoveryPresentation={recoveryPresentationForError(error)}
              />
              {error.rawDetail !== undefined && error.rawDetail !== null && error.rawDetail.trim().length > 0 ? (
                <details className="mt-2" data-testid="bulk-evidence-upload-error-diagnostics">
                  <summary className={cn("cursor-pointer", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>Technical details</summary>
                  <p
                    className={cn(
                      "m-0 mt-2 whitespace-pre-wrap break-words rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 font-mono text-al-text-secondary dark:border-neutral-700",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                  >
                    {error.rawDetail}
                  </p>
                </details>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {uploadSummary ? (
        <div
          className={
            uploadSummary.isPartial
              ? cn("space-y-2 p-2", OPERATOR_CALLOUT_WARN_CLASS)
              : cn("flex items-start gap-2 p-2", OPERATOR_CALLOUT_SUCCESS_CLASS)
          }
          data-testid="bulk-evidence-upload-summary"
        >
          {uploadSummary.isPartial ? (
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          )}
          <div className="min-w-0 space-y-2">
            <p className="m-0 font-medium">{uploadSummary.message}</p>
            {uploadSummary.isPartial ? (
              <ul className="m-0 list-none space-y-1 p-0" data-testid="bulk-evidence-upload-file-outcomes">
                {uploadSummary.outcomes
                  .filter((outcome) => outcome.status === "failed")
                  .map((outcome) => (
                    <li key={outcome.fileName} className={OPERATOR_TYPOGRAPHY.helper}>
                      <span className="font-medium">{outcome.fileName}</span>
                      {outcome.reason ? (
                        <span className="text-amber-900 dark:text-amber-200"> — {outcome.reason}</span>
                      ) : null}
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      <BulkEvidenceFileList files={files} uploading={uploading} onRemoveFile={removeFile} />

      <BulkEvidenceUploadProgress
        uploading={showProgress}
        progressPercent={progressPercent}
        etaLabel={etaLabel}
        onCancelUpload={cancelUpload}
      />

      <Button
        onClick={uploadFiles}
        disabled={files.length === 0 || uploading || isMaxFilesBlocked}
        className={CTA_WIDTH.content}
      >
        {uploadButtonLabel}
      </Button>
    </div>
  );

  return body;
}
