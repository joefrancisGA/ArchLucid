"use client";

import { useState } from "react";

import {
  DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  getAzureExtractorDemoScenario,
  getAzureExtractorDemoZipBytes,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { readArchLucidAzurePackageZipFromBytes } from "@/lib/read-arch-lucid-azure-package-zip";

export type UseExtractUploadDemoInput = {
  readonly onUpload: (file: File) => Promise<void>;
  readonly clearUploadState: () => void;
  readonly setUploadError: (error: {
    message: string;
    problem: null;
    correlationId: null;
  }) => void;
  readonly clearSelectionState: () => void;
  readonly setSelectedFileLabel: (label: string | null) => void;
};

export function useExtractUploadDemo({
  onUpload,
  clearUploadState,
  setUploadError,
  clearSelectionState,
  setSelectedFileLabel,
}: UseExtractUploadDemoInput) {
  const [selectedDemoScenarioId, setSelectedDemoScenarioId] = useState<AzureExtractorDemoScenarioId>(
    DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  );

  async function onTryDemoData(): Promise<void> {
    clearUploadState();
    clearSelectionState();

    const scenario = getAzureExtractorDemoScenario(selectedDemoScenarioId);
    const bytes = getAzureExtractorDemoZipBytes(selectedDemoScenarioId);
    const validation = readArchLucidAzurePackageZipFromBytes(bytes);

    if (!validation.ok) {
      setUploadError({
        message: validation.message,
        problem: null,
        correlationId: null,
      });

      return;
    }

    const demoFile = new File([new Uint8Array(bytes)], scenario.zipFilename, {
      type: "application/zip",
    });
    setSelectedFileLabel(`${demoFile.name} (bundled demo)`);
    await onUpload(demoFile);
  }

  return {
    selectedDemoScenarioId,
    setSelectedDemoScenarioId,
    onTryDemoData,
  };
}
