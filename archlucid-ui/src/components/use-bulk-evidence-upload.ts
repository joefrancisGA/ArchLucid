import { useRef, useState } from "react";

import { postBulkEvidenceMultipartWithProgress } from "@/lib/bulk-evidence-upload-client";
import {
  BULK_EVIDENCE_UPLOAD_FILE_NOT_STORED_REASON,
  BULK_EVIDENCE_UPLOAD_MAX_FILES,
} from "@/lib/bulk-evidence-upload-copy";
import {
  buildBulkEvidenceUploadSummary,
  parsePartialUploadCountFromDetail,
  parseSuccessUploadedCount,
  type BulkEvidenceUploadSummary,
} from "@/lib/bulk-evidence-upload-outcome";
import { formatUploadEta, estimateUploadSecondsRemaining } from "@/lib/format-upload-eta";
import { readProblemDetailFromBody } from "@/lib/api-problem";

export type BulkEvidenceUploadError = {
  readonly kind: "max-files" | "upload-failed" | "canceled" | "unexpected";
  readonly userMessage: string;
  readonly rawDetail?: string | null;
};

function countNonEmptyFiles(files: File[]): number {
  return files.filter((file) => file.size > 0).length;
}

export function useBulkEvidenceUpload(
  runId: string,
  onUploadSummary?: (summary: BulkEvidenceUploadSummary) => void,
) {
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

  return {
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
  };
}
