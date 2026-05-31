"use client";

import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, UploadCloud, X } from "lucide-react";

import { postBulkEvidenceMultipartWithProgress } from "@/lib/bulk-evidence-upload-client";
import {
  buildBulkEvidenceUploadSummary,
  parsePartialUploadCountFromDetail,
  parseSuccessUploadedCount,
  type BulkEvidenceUploadSummary,
} from "@/lib/bulk-evidence-upload-outcome";
import { formatUploadEta, estimateUploadSecondsRemaining } from "@/lib/format-upload-eta";

import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

export interface BulkEvidenceUploadProps {
  runId: string;
}

const MAX_FILES = 200;

function parseProblemDetail(bodyText: string): string | undefined {
  try {
    const problem = JSON.parse(bodyText) as { detail?: string };

    return typeof problem.detail === "string" ? problem.detail : undefined;
  } catch {
    return undefined;
  }
}

function countNonEmptyFiles(files: File[]): number {
  return files.filter((file) => file.size > 0).length;
}

/**
 * Bulk evidence upload for a review run (`POST /v1/architecture/run/{runId}/evidence/bulk`).
 * @see `BulkEvidenceUpload.test.tsx`
 */
export function BulkEvidenceUpload({ runId }: BulkEvidenceUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [etaLabel, setEtaLabel] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<BulkEvidenceUploadSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadStartedAtRef = useRef<number>(0);

  const handleFiles = (selectedFiles: FileList | File[]) => {
    setError(null);
    setUploadSummary(null);

    const newFiles = Array.from(selectedFiles);
    const totalFiles = files.length + newFiles.length;

    if (totalFiles > MAX_FILES) {
      const excess = totalFiles - MAX_FILES;
      setError(
        `Maximum ${MAX_FILES} files per upload. Please remove ${excess} files or upload in multiple batches.`,
      );

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

    if (error) {
      setError(null);
    }
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

    try {
      const result = await postBulkEvidenceMultipartWithProgress(runId, batch, (progress) => {
        setProgressPercent(Math.round(progress.percent));

        const etaSeconds = estimateUploadSecondsRemaining(
          progress.loadedBytes,
          progress.totalBytes,
          uploadStartedAtRef.current,
          Date.now(),
        );

        setEtaLabel(formatUploadEta(etaSeconds));
      });

      setProgressPercent(100);
      setEtaLabel(null);

      if (result.status >= 200 && result.status < 300) {
        const uploadedNonEmptyCount = parseSuccessUploadedCount(result.bodyText);
        const expectedNonEmpty = countNonEmptyFiles(batch);
        const summary = buildBulkEvidenceUploadSummary(
          batch,
          uploadedNonEmptyCount,
          "Not stored by server",
          uploadedNonEmptyCount === expectedNonEmpty
            ? "Evidence successfully uploaded."
            : "Upload completed with warnings.",
        );

        setUploadSummary(summary);

        if (!summary.isPartial) {
          setFiles([]);
        }

        return;
      }

      const detail = parseProblemDetail(result.bodyText);
      const partialUploaded = parsePartialUploadCountFromDetail(detail);

      if (partialUploaded !== null && partialUploaded > 0) {
        const summary = buildBulkEvidenceUploadSummary(
          batch,
          partialUploaded,
          detail ?? "Upload failed",
          "Upload partially completed.",
        );

        setUploadSummary(summary);

        return;
      }

      setError(detail ?? "Upload failed.");
    } catch (uploadError) {
      if (uploadError instanceof DOMException && uploadError.name === "AbortError") {
        setError("Upload cancelled.");
      } else {
        setError("An unexpected error occurred during upload.");
      }
    } finally {
      setUploading(false);
    }
  };

  const showProgress = uploading;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-medium">Add evidence</h3>
      <p className="text-sm text-neutral-500">
        Upload up to {MAX_FILES} files per action. ZIP archives are expanded automatically (up to 1 000 entries each).
      </p>

      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 transition-colors hover:bg-neutral-100"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => inputRef.current?.click()}
        aria-label="Drag and drop evidence files here, or click to browse"
        role="button"
        tabIndex={0}
      >
        <UploadCloud className="mb-2 h-8 w-8 text-neutral-400" />
        <p className="text-sm font-medium text-neutral-700">Drag files here or click to browse</p>
        <input
          type="file"
          multiple
          className="hidden"
          ref={inputRef}
          aria-label="Drag and drop evidence files here"
          data-testid="evidence-file-input"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }

            e.target.value = "";
          }}
          aria-describedby="upload-error"
        />
      </div>

      <div aria-live="polite" className="sr-only">
        {files.length} out of {MAX_FILES} files selected
      </div>

      <div className="flex items-center justify-between text-sm font-medium">
        <span>
          {files.length} / {MAX_FILES} files
        </span>
      </div>

      {error ? (
        <div
          id="upload-error"
          className="flex items-center rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50 p-2"
          data-testid="bulk-evidence-upload-error"
        >
          <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {uploadSummary ? (
        <div
          className={
            uploadSummary.isPartial
              ? "space-y-2 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 p-2"
              : "flex items-start gap-2 rounded-md border border-emerald-700/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-emerald-800/50 p-2"
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
                    <li key={outcome.fileName} className="text-xs">
                      <span className="font-medium">{outcome.fileName}</span>
                      {outcome.reason ? <span className="text-amber-900/80"> — {outcome.reason}</span> : null}
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {files.length > 0 ? (
        <ul className="max-h-48 space-y-2 overflow-y-auto rounded border bg-white p-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between p-1 text-sm hover:bg-neutral-50">
              <span className="max-w-[200px] truncate" title={f.name}>
                {f.name}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="p-1 text-neutral-500 hover:text-red-500"
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
        <div className="space-y-1" data-testid="bulk-evidence-upload-progress">
          <Progress value={progressPercent} className="h-2 w-full" aria-label="Upload progress" />
          <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span>{progressPercent}%</span>
            {etaLabel ? <span>{etaLabel}</span> : null}
          </div>
        </div>
      ) : null}

      <Button onClick={uploadFiles} disabled={files.length === 0 || uploading || !!error} className="w-full">
        {uploading ? "Uploading…" : "Upload Evidence"}
      </Button>
    </div>
  );
}
