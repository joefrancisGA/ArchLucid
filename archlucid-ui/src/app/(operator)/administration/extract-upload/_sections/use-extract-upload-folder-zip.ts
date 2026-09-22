"use client";

import { useState } from "react";

import { buildArchLucidAzurePackageZipFromFileList, type FolderPackageFileStatus } from "@/lib/read-arch-lucid-azure-folder-package";
import { readArchLucidAzurePackageZipFromFile } from "@/lib/read-arch-lucid-azure-package-zip";

export type UseExtractUploadFolderZipInput = {
  readonly onUpload: (file: File, fileLabel: string) => Promise<void>;
  readonly clearUploadState: () => void;
  readonly setUploadError: (error: {
    message: string;
    problem: null;
    correlationId: null;
  }) => void;
};

export function useExtractUploadFolderZip({
  onUpload,
  clearUploadState,
  setUploadError,
}: UseExtractUploadFolderZipInput) {
  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<FolderPackageFileStatus[]>([]);

  async function onFolderSelected(files: FileList): Promise<void> {
    clearUploadState();
    setFileStatuses([]);

    const built = await buildArchLucidAzurePackageZipFromFileList(files);
    setFileStatuses(built.fileStatuses);

    if (!built.ok) {
      setUploadError({
        message: built.message,
        problem: null,
        correlationId: null,
      });

      return;
    }

    const fileLabel = `${built.zipFile.name} (folder packaged)`;
    setSelectedFileLabel(fileLabel);
    await onUpload(built.zipFile, fileLabel);
  }

  async function onZipSelected(file: File): Promise<void> {
    clearUploadState();
    const fileLabel = `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`;
    setSelectedFileLabel(fileLabel);

    const validation = await readArchLucidAzurePackageZipFromFile(file);

    if (!validation.ok) {
      setUploadError({
        message: validation.message,
        problem: null,
        correlationId: null,
      });

      return;
    }

    await onUpload(file, fileLabel);
  }

  function clearSelectionState(): void {
    setSelectedFileLabel(null);
    setFileStatuses([]);
  }

  return {
    selectedFileLabel,
    setSelectedFileLabel,
    fileStatuses,
    onFolderSelected,
    onZipSelected,
    clearSelectionState,
  };
}
