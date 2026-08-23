"use client";
import { cn } from "@/lib/utils";
import {
  CTA_WIDTH,
  OPERATOR_CALLOUT_SUCCESS_CLASS,
  OPERATOR_CALLOUT_WARN_CLASS,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, UploadCloud, X } from "lucide-react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { postBulkEvidenceMultipartWithProgress } from "@/lib/bulk-evidence-upload-client";
import {
  BULK_EVIDENCE_UPLOAD_CANCEL_RECOVERY,
  BULK_EVIDENCE_UPLOAD_FAILURE_RECOVERY,
  BULK_EVIDENCE_UPLOAD_FILE_NOT_STORED_REASON,
  BULK_EVIDENCE_UPLOAD_MAX_FILES,
  RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE,
} from "@/lib/bulk-evidence-upload-copy";
import {
  buildBulkEvidenceUploadSummary,
  parsePartialUploadCountFromDetail,
  parseSuccessUploadedCount,
  type BulkEvidenceUploadSummary,
} from "@/lib/bulk-evidence-upload-outcome";
import { formatUploadEta, estimateUploadSecondsRemaining } from "@/lib/format-upload-eta";
import { readProblemDetailFromBody } from "@/lib/api-problem";

import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { LongOperationWaitNotice } from "@/components/LongOperationWaitNotice";
import { FolderAwareFileInput } from "@/components/FolderAwareFileInput";

export interface BulkEvidenceUploadProps {
  runId: string;
  /** When true, renders body only — parent owns card chrome and heading. */
  embedded?: boolean;
  readonly onUploadSummary?: (summary: BulkEvidenceUploadSummary) => void;
}

type BulkEvidenceUploadError = {
  readonly kind: "max-files" | "upload-failed" | "canceled" | "unexpected";
  readonly userMessage: string;
  readonly rawDetail?: string | null;
};

function countNonEmptyFiles(files: File[]): number {
  return files.filter((file) => file.size > 0).length;
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
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<BulkEvidenceUploadError | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [etaLabel, setEtaLabel] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<BulkEvidenceUploadSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const uploadStartedAtRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isMaxFilesBlocked = error?.kind === "max-files";

  const handleFiles = (selectedFiles: FileList | File[]) => {
    setError(null);
    setUploadSummary(null);

    const newFiles = Array.from(selectedFiles);
    const totalFiles = files.length + newFiles.length;

    if (totalFiles > BULK_EVIDENCE_UPLOAD_MAX_FILES) {
      const excess = totalFiles - BULK_EVIDENCE_UPLOAD_MAX_FILES;

      setError({
        kind: "max-files",
        userMessage: `Maximum ${BULK_EVIDENCE_UPLOAD_MAX_FILES} files per upload. Please remove ${excess} files or upload in multiple batches.`,
      });

      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));

    if (error !== null) {
      setError(null);
    }
  };

  const cancelUpload = () => {
    abortControllerRef.current?.abort();
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setProgressPercent(0);
    setEtaLabel(null);
    setError(null);
    setUploadSummary(null);
    uploadStartedAtRef.current = Date.now();

    const batch = [...files];
    const controller = new AbortController();

    abortControllerRef.current = controller;

    try {
      const result = await postBulkEvidenceMultipartWithProgress(
        runId,
        batch,
        (progress) => {
          setProgressPercent(Math.round(progress.percent));

          const etaSeconds = estimateUploadSecondsRemaining(
            progress.loadedBytes,
            progress.totalBytes,
            uploadStartedAtRef.current,
            Date.now(),
          );

          setEtaLabel(formatUploadEta(etaSeconds));
        },
        controller.signal,
      );

      setProgressPercent(100);
      setEtaLabel(null);

      if (result.status >= 200 && result.status < 300) {
        const uploadedNonEmptyCount = parseSuccessUploadedCount(result.bodyText);
        const expectedNonEmpty = countNonEmptyFiles(batch);
        const summary = buildBulkEvidenceUploadSummary(
          batch,
          uploadedNonEmptyCount,
          BULK_EVIDENCE_UPLOAD_FILE_NOT_STORED_REASON,
          uploadedNonEmptyCount === expectedNonEmpty
            ? "Evidence successfully uploaded."
            : "Upload completed with warnings.",
        );

        setUploadSummary(summary);
        onUploadSummary?.(summary);

        if (!summary.isPartial) {
          setFiles([]);
        }

        return;
      }

      const detail = readProblemDetailFromBody(result.bodyText);
      const partialUploaded = parsePartialUploadCountFromDetail(detail);

      if (partialUploaded !== null && partialUploaded > 0) {
        const summary = buildBulkEvidenceUploadSummary(
          batch,
          partialUploaded,
          detail ?? "Upload failed",
          "Upload partially completed.",
        );

        setUploadSummary(summary);
        onUploadSummary?.(summary);

        return;
      }

      setError({
        kind: "upload-failed",
        userMessage: "Evidence upload could not be completed.",
        rawDetail: detail ?? result.bodyText,
      });
    } catch (uploadError) {
      if (uploadError instanceof DOMException && uploadError.name === "AbortError") {
        setError({
          kind: "canceled",
          userMessage: "Upload canceled.",
        });
      } else {
        setError({
          kind: "unexpected",
          userMessage: "An unexpected error occurred during upload.",
          rawDetail: uploadError instanceof Error ? uploadError.message : null,
        });
      }
    } finally {
      abortControllerRef.current = null;
      setUploading(false);
    }
  };

  const showProgress = uploading;
  const uploadButtonLabel = uploading
    ? "Uploading…"
    : error !== null && !isMaxFilesBlocked
      ? "Retry upload"
      : "Upload evidence";

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

      {files.length > 0 ? (
        <ul className="max-h-48 space-y-2 overflow-y-auto rounded border border-neutral-200 bg-al-surface-raised p-2 dark:border-neutral-700">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className={cn(
                "flex items-center justify-between gap-2 p-1 hover:bg-[var(--al-layer-hover)]",
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              <span className="min-w-0 flex-1 break-all text-al-text-primary">{f.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="shrink-0 p-1 text-neutral-500 hover:text-red-500"
                aria-label={`Remove ${f.name}`}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showProgress ? (
        <div className="space-y-2" data-testid="bulk-evidence-upload-progress">
          <LongOperationWaitNotice
            active={uploading}
            operationLabel="Uploading evidence"
            stageLabel="Transferring files to ArchLucid"
            testId="bulk-evidence-long-wait"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cancelUpload}
            className={CTA_WIDTH.content}
            data-testid="bulk-evidence-upload-cancel"
          >
            Cancel upload
          </Button>
          <Progress value={progressPercent} className="h-2 w-full" aria-label="Upload progress" />
          <div className={cn("flex justify-between text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span>{progressPercent}%</span>
            {etaLabel ? <span>{etaLabel}</span> : null}
          </div>
        </div>
      ) : null}

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
