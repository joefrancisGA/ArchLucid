"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  getAzureExtractorDemoScenario,
  getAzureExtractorDemoZipBytes,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { readArchLucidAzurePackageZipFromBytes } from "@/lib/read-arch-lucid-azure-package-zip";
import {
  extractUploadDemoScenarioHrefFromSearch,
  parseExtractUploadDemoScenarioFromSearch,
} from "@/lib/administration/extract-upload-demo-scenario-url";

export type UseExtractUploadDemoInput = {
  readonly router: AppRouterInstance;
  readonly pathname: string;
  readonly searchParams: Readonly<URLSearchParams>;
  readonly onUpload: (file: File, fileLabel: string) => Promise<void>;
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
  router,
  pathname,
  searchParams,
  onUpload,
  clearUploadState,
  setUploadError,
  clearSelectionState,
  setSelectedFileLabel,
}: UseExtractUploadDemoInput) {
  const urlDemoScenario = parseExtractUploadDemoScenarioFromSearch(searchParams.get("demoScenario"));
  const [selectedDemoScenarioId, setSelectedDemoScenarioIdState] = useState<AzureExtractorDemoScenarioId>(
    urlDemoScenario ?? DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  );
  const [demoScenarioExplicitlySelected, setDemoScenarioExplicitlySelected] = useState(
    urlDemoScenario !== null,
  );

  const setSelectedDemoScenarioId = useCallback(
    (scenarioId: AzureExtractorDemoScenarioId) => {
      setSelectedDemoScenarioIdState(scenarioId);
      setDemoScenarioExplicitlySelected(true);
      router.replace(extractUploadDemoScenarioHrefFromSearch(searchParams.toString(), scenarioId, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const fromUrl = parseExtractUploadDemoScenarioFromSearch(searchParams.get("demoScenario"));

    if (fromUrl !== null) {
      setSelectedDemoScenarioIdState(fromUrl);
      setDemoScenarioExplicitlySelected(true);
    }
  }, [searchParams]);

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
    const fileLabel = `${demoFile.name} (bundled demo)`;
    setSelectedFileLabel(fileLabel);
    await onUpload(demoFile, fileLabel);
  }

  return {
    selectedDemoScenarioId,
    setSelectedDemoScenarioId,
    demoScenarioExplicitlySelected,
    onTryDemoData,
  };
}
