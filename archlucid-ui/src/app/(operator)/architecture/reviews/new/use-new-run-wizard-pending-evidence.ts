"use client";

import { useCallback, useEffect, useState } from "react";

import type { WizardEvidenceUploadTrackState } from "@/components/wizard/steps/WizardPostCreateEvidenceUploadPanel";
import type { ApiProblemDetails } from "@/lib/api-problem";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { detectTier1InventoryPlatformFromFile } from "@/lib/read-tier1-inventory-package-zip";
import {
  uploadWizardPendingDocumentEvidence,
  uploadWizardPendingInventoryEvidence,
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
  readonly onInventoryFileSelected: (platform: CloudInventoryPlatform) => void;
};

/**
 * Evidence chosen before the review exists, and its upload once a run id is available.
 *
 * Evidence cannot be attached until the review is created, so the wizard holds the files and replays
 * them afterwards — including a retry path, because a failed upload must not discard the operator's
 * selection.
 */
export function useNewRunWizardPendingEvidence(options: PendingEvidenceOptions) {
  const { autoUploadOnCreate, onInventoryFileSelected, runId } = options;

  const [pendingEvidenceFile, setPendingEvidenceFile] = useState<File | null>(null);
  const [pendingInventoryPlatform, setPendingInventoryPlatform] = useState<CloudInventoryPlatform | null>(null);
  const [pendingDocumentFiles, setPendingDocumentFiles] = useState<File[]>([]);
  const [evidenceUploadState, setEvidenceUploadState] = useState<WizardEvidenceUploadTrackState>("idle");
  const [evidenceUploadProgressPercent, setEvidenceUploadProgressPercent] = useState<number | null>(null);
  const [evidenceUploadError, setEvidenceUploadError] = useState<PendingEvidenceUploadFailure | null>(null);

  const handlePendingEvidenceFileChange = useCallback(
    (file: File | null) => {
      setPendingEvidenceFile(file);

      if (file === null) {
        setPendingInventoryPlatform(null);

        return;
      }

      void (async () => {
        const platform = await detectTier1InventoryPlatformFromFile(file);

        if (platform === null) {
          setPendingInventoryPlatform(null);

          return;
        }

        setPendingInventoryPlatform(platform);
        onInventoryFileSelected(platform);
      })();
    },
    [onInventoryFileSelected],
  );

  const clearPendingEvidence = useCallback(() => {
    setPendingEvidenceFile(null);
    setPendingInventoryPlatform(null);
    setPendingDocumentFiles([]);
  }, []);

  const uploadPendingEvidence = useCallback(
    async (runIdValue: string): Promise<void> => {
      const inventoryFile = pendingEvidenceFile;
      const inventoryPlatform = pendingInventoryPlatform;
      const documentFiles = pendingDocumentFiles;
      const hasInventory = inventoryFile !== null && inventoryPlatform !== null;
      const hasDocuments = documentFiles.length > 0;

      if (!hasInventory && !hasDocuments) {
        return;
      }

      setEvidenceUploadState("uploading");
      setEvidenceUploadError(null);
      setEvidenceUploadProgressPercent(null);

      if (hasInventory && inventoryFile !== null && inventoryPlatform !== null) {
        const inventoryResult = await uploadWizardPendingInventoryEvidence(
          runIdValue,
          inventoryPlatform,
          inventoryFile,
          {
            onUploadProgress: (percent) => {
              setEvidenceUploadProgressPercent(percent);
            },
          },
        );

        if (!inventoryResult.ok) {
          setEvidenceUploadState("failed");
          setEvidenceUploadProgressPercent(null);
          setEvidenceUploadError({
            message: inventoryResult.message,
            problem: inventoryResult.problem,
            correlationId: inventoryResult.correlationId,
          });

          return;
        }

        setPendingEvidenceFile(null);
        setPendingInventoryPlatform(null);
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
    [pendingDocumentFiles, pendingEvidenceFile, pendingInventoryPlatform],
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
