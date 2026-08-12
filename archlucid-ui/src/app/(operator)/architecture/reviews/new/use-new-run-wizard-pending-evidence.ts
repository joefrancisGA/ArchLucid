"use client";

import { useCallback, useEffect, useState } from "react";

import type { WizardEvidenceUploadTrackState } from "@/components/wizard/steps/WizardPostCreateEvidenceUploadPanel";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  uploadWizardPendingAzureEvidence,
  uploadWizardPendingDocumentEvidence,
} from "@/lib/wizard-pending-evidence-upload";

type PendingEvidenceUploadFailure = {
  readonly message: string;
  readonly problem: ApiProblemDetails | null;
  readonly correlationId: string | null;
};

type PendingEvidenceOptions = {
  readonly runId: string | null;
  /** Quick start uploads as soon as the review exists; the full wizard waits for the pipeline slide. */
  readonly autoUploadOnCreate: boolean;
  readonly onAzureFileSelected: () => void;
};

/**
 * Evidence chosen before the review exists, and its upload once a run id is available.
 *
 * Evidence cannot be attached until the review is created, so the wizard holds the files and replays
 * them afterwards — including a retry path, because a failed upload must not discard the operator's
 * selection.
 */
export function useNewRunWizardPendingEvidence(options: PendingEvidenceOptions) {
  const { autoUploadOnCreate, onAzureFileSelected, runId } = options;

  const [pendingEvidenceFile, setPendingEvidenceFile] = useState<File | null>(null);
  const [pendingDocumentFiles, setPendingDocumentFiles] = useState<File[]>([]);
  const [evidenceUploadState, setEvidenceUploadState] = useState<WizardEvidenceUploadTrackState>("idle");
  const [evidenceUploadProgressPercent, setEvidenceUploadProgressPercent] = useState<number | null>(null);
  const [evidenceUploadError, setEvidenceUploadError] = useState<PendingEvidenceUploadFailure | null>(null);

  const handlePendingEvidenceFileChange = useCallback(
    (file: File | null) => {
      setPendingEvidenceFile(file);

      if (file !== null) {
        onAzureFileSelected();
      }
    },
    [onAzureFileSelected],
  );

  const clearPendingEvidence = useCallback(() => {
    setPendingEvidenceFile(null);
    setPendingDocumentFiles([]);
  }, []);

  const uploadPendingEvidence = useCallback(
    async (runIdValue: string): Promise<void> => {
      const azureFile = pendingEvidenceFile;
      const documentFiles = pendingDocumentFiles;
      const hasAzure = azureFile !== null;
      const hasDocuments = documentFiles.length > 0;

      if (!hasAzure && !hasDocuments) {
        return;
      }

      setEvidenceUploadState("uploading");
      setEvidenceUploadError(null);
      setEvidenceUploadProgressPercent(null);

      if (hasAzure && azureFile !== null) {
        const azureResult = await uploadWizardPendingAzureEvidence(runIdValue, azureFile, {
          onUploadProgress: (percent) => {
            setEvidenceUploadProgressPercent(percent);
          },
        });

        if (!azureResult.ok) {
          setEvidenceUploadState("failed");
          setEvidenceUploadProgressPercent(null);
          setEvidenceUploadError({
            message: azureResult.message,
            problem: azureResult.problem,
            correlationId: azureResult.correlationId,
          });

          return;
        }

        setPendingEvidenceFile(null);
      }

      if (documentFiles.length > 0) {
        const documentResult = await uploadWizardPendingDocumentEvidence(runIdValue, documentFiles);

        if (!documentResult.ok) {
          setEvidenceUploadState("failed");
          setEvidenceUploadError({
            message: documentResult.message,
            problem: documentResult.problem,
            correlationId: documentResult.correlationId,
          });

          return;
        }

        setPendingDocumentFiles([]);
      }

      setEvidenceUploadState("success");
      setEvidenceUploadProgressPercent(null);
    },
    [pendingDocumentFiles, pendingEvidenceFile],
  );

  const retryEvidenceUpload = useCallback(async () => {
    if (runId === null) {
      return;
    }

    if (pendingEvidenceFile === null && pendingDocumentFiles.length === 0) {
      return;
    }

    await uploadPendingEvidence(runId);
  }, [pendingDocumentFiles, pendingEvidenceFile, runId, uploadPendingEvidence]);

  useEffect(() => {
    if (runId === null || !autoUploadOnCreate) {
      return;
    }

    if (pendingEvidenceFile === null && pendingDocumentFiles.length === 0) {
      return;
    }

    if (evidenceUploadState !== "idle") {
      return;
    }

    void uploadPendingEvidence(runId);
  }, [
    autoUploadOnCreate,
    evidenceUploadState,
    pendingDocumentFiles,
    pendingEvidenceFile,
    runId,
    uploadPendingEvidence,
  ]);

  const hasPendingEvidence = pendingEvidenceFile !== null || pendingDocumentFiles.length > 0;

  return {
    pendingEvidenceFile,
    pendingDocumentFiles,
    setPendingDocumentFiles,
    evidenceUploadState,
    evidenceUploadProgressPercent,
    evidenceUploadError,
    hasPendingEvidence,
    handlePendingEvidenceFileChange,
    clearPendingEvidence,
    uploadPendingEvidence,
    retryEvidenceUpload,
  };
}
