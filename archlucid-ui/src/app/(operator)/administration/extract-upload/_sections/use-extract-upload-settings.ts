"use client";

import { useMemo, useState } from "react";

import { useExtractUploadBaselineQuery } from "@/hooks/use-extract-upload-baseline-query";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import {
  DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  getAzureExtractorDemoScenario,
  getAzureExtractorDemoZipBytes,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { buildArchLucidAzurePackageZipFromFileList, type FolderPackageFileStatus } from "@/lib/read-arch-lucid-azure-folder-package";
import { readArchLucidAzurePackageZipFromBytes, readArchLucidAzurePackageZipFromFile } from "@/lib/read-arch-lucid-azure-package-zip";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  resolveExtractUploadPackageEmphasizedStepId,
  resolveExtractUploadPackageSteps,
} from "@/lib/extract-upload-package-checklist";

export function useExtractUploadSettings() {
  const baselineQuery = useExtractUploadBaselineQuery();
  const [busy, setBusy] = useState(false);
  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<FolderPackageFileStatus[]>([]);
  const [selectedDemoScenarioId, setSelectedDemoScenarioId] = useState<AzureExtractorDemoScenarioId>(
    DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  );
  const baselineLoading = baselineQuery.isPending;
  const hasBaselineArtifacts = baselineQuery.data?.hasBaselineArtifacts ?? null;
  const extractorScriptVersion = baselineQuery.data?.extractorScriptVersion ?? null;
  const extractorUpdateBanner = baselineQuery.data?.extractorUpdateBanner ?? null;
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));
  const extractUploadSteps = useMemo(
    () =>
      resolveExtractUploadPackageSteps({
        scenarioSelected: selectedDemoScenarioId.trim().length > 0,
        packageUploaded: packageId !== null || selectedFileLabel !== null,
        inventoryParsed: hasBaselineArtifacts === true || packageId !== null,
      }),
    [hasBaselineArtifacts, packageId, selectedDemoScenarioId, selectedFileLabel],
  );
  const extractUploadEmphasizedStepId = useMemo(
    () =>
      resolveExtractUploadPackageEmphasizedStepId({
        scenarioSelected: selectedDemoScenarioId.trim().length > 0,
        packageUploaded: packageId !== null || selectedFileLabel !== null,
        inventoryParsed: hasBaselineArtifacts === true || packageId !== null,
      }),
    [hasBaselineArtifacts, packageId, selectedDemoScenarioId, selectedFileLabel],
  );

  async function onUpload(file: File) {
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/proxy/v1/azure-extractor/upload",
        mergeRegistrationScopeForProxy({
          method: "POST",
          body: formData,
        }),
      );

      const bodyText = await response.text();
      const correlationId = response.headers.get("X-Correlation-ID");

      if (!response.ok) {
        const apiError = buildApiRequestErrorFromParts(response, bodyText);
        setUploadError({
          message: apiError.message,
          problem: apiError.problem,
          correlationId: apiError.correlationId ?? correlationId,
        });

        return;
      }

      try {
        const payload = JSON.parse(bodyText) as { packageId?: string };
        setPackageId(payload.packageId ?? null);
      } catch {
        setPackageId(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onFolderSelected(files: FileList): Promise<void> {
    setUploadError(null);
    setPackageId(null);
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

    setSelectedFileLabel(`${built.zipFile.name} (folder packaged)`);
    await onUpload(built.zipFile);
  }

  async function onZipSelected(file: File): Promise<void> {
    setUploadError(null);
    setPackageId(null);
    setSelectedFileLabel(`${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`);

    const validation = await readArchLucidAzurePackageZipFromFile(file);

    if (!validation.ok) {
      setUploadError({
        message: validation.message,
        problem: null,
        correlationId: null,
      });

      return;
    }

    await onUpload(file);
  }

  async function onTryDemoData(): Promise<void> {
    setUploadError(null);
    setPackageId(null);
    setFileStatuses([]);

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
    baselineLoading,
    hasBaselineArtifacts,
    extractorScriptVersion,
    extractorUpdateBanner,
    maxMb,
    extractUploadSteps,
    extractUploadEmphasizedStepId,
    busy,
    selectedFileLabel,
    uploadError,
    packageId,
    fileStatuses,
    selectedDemoScenarioId,
    setSelectedDemoScenarioId,
    onFolderSelected,
    onZipSelected,
    onTryDemoData,
  };
}

export type ExtractUploadSettingsViewModel = ReturnType<typeof useExtractUploadSettings>;
