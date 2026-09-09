"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useExtractUploadBaselineQuery, extractorScriptCdnUrl } from "@/hooks/use-extract-upload-baseline-query";
import {
  extractUploadAdvancedCommandDisclosureHrefFromSearch,
  parseExtractUploadAdvancedCommandOpenFromSearch,
} from "@/lib/administration/extract-upload-advanced-command-disclosure-url";
import {
  extractUploadValidateDisclosureHrefFromSearch,
  parseExtractUploadValidateDisclosureOpenFromSearch,
} from "@/lib/administration/extract-upload-validate-disclosure-url";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  resolveExtractUploadPackageEmphasizedStepId,
  resolveExtractUploadPackageSteps,
} from "@/lib/extract-upload-package-checklist";

import { useExtractUploadDemo } from "./use-extract-upload-demo";
import { useExtractUploadFolderZip } from "./use-extract-upload-folder-zip";
import { useExtractUploadUpload } from "./use-extract-upload-upload";

export type UseExtractUploadPageClientInput = {
  readonly router: AppRouterInstance;
  readonly pathname: string;
  readonly searchParams: Readonly<URLSearchParams>;
};

export function useExtractUploadPageClient({ router, pathname, searchParams }: UseExtractUploadPageClientInput) {
  const extractUploadValidateDisclosureOpenParam = searchParams.get("extractUploadValidateDisclosureOpen");
  const extractUploadAdvancedCommandOpenParam = searchParams.get("extractUploadAdvancedCommandOpen");
  const { productLine } = useProductLine();
  const extractorScriptDownloadUrl = extractorScriptCdnUrl(productLine);
  const [validateDisclosureOpen, setValidateDisclosureOpenState] = useState(() =>
    parseExtractUploadValidateDisclosureOpenFromSearch(extractUploadValidateDisclosureOpenParam),
  );
  const [advancedCommandOpen, setAdvancedCommandOpenState] = useState(() =>
    parseExtractUploadAdvancedCommandOpenFromSearch(extractUploadAdvancedCommandOpenParam),
  );
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const baselineQuery = useExtractUploadBaselineQuery(productLine);
  const upload = useExtractUploadUpload();
  const folderZip = useExtractUploadFolderZip({
    onUpload: upload.onUpload,
    clearUploadState: upload.clearUploadState,
    setUploadError: upload.setUploadError,
  });
  const demo = useExtractUploadDemo({
    router,
    pathname,
    searchParams,
    onUpload: upload.onUpload,
    clearUploadState: upload.clearUploadState,
    setUploadError: upload.setUploadError,
    clearSelectionState: folderZip.clearSelectionState,
    setSelectedFileLabel: folderZip.setSelectedFileLabel,
  });

  const baselineLoading = baselineQuery.isPending;
  const hasBaselineArtifacts = baselineQuery.data?.hasBaselineArtifacts ?? null;
  const extractorScriptVersion = baselineQuery.data?.extractorScriptVersion ?? null;
  const extractorUpdateBanner = baselineQuery.data?.extractorUpdateBanner ?? null;
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));
  const extractUploadSteps = useMemo(
    () =>
      resolveExtractUploadPackageSteps({
        scenarioSelected: demo.selectedDemoScenarioId.trim().length > 0,
        packageUploaded: upload.packageId !== null || folderZip.selectedFileLabel !== null,
        inventoryParsed: hasBaselineArtifacts === true || upload.packageId !== null,
      }),
    [demo.selectedDemoScenarioId, folderZip.selectedFileLabel, hasBaselineArtifacts, upload.packageId],
  );
  const extractUploadEmphasizedStepId = useMemo(
    () =>
      resolveExtractUploadPackageEmphasizedStepId({
        scenarioSelected: demo.selectedDemoScenarioId.trim().length > 0,
        packageUploaded: upload.packageId !== null || folderZip.selectedFileLabel !== null,
        inventoryParsed: hasBaselineArtifacts === true || upload.packageId !== null,
      }),
    [demo.selectedDemoScenarioId, folderZip.selectedFileLabel, hasBaselineArtifacts, upload.packageId],
  );

  const syncValidateDisclosureOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        extractUploadValidateDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setValidateDisclosureOpen = useCallback(
    (open: boolean) => {
      setValidateDisclosureOpenState(open);
      syncValidateDisclosureOpenToUrl(open);
    },
    [syncValidateDisclosureOpenToUrl],
  );

  useEffect(() => {
    setValidateDisclosureOpenState(
      parseExtractUploadValidateDisclosureOpenFromSearch(extractUploadValidateDisclosureOpenParam),
    );
  }, [extractUploadValidateDisclosureOpenParam]);

  const syncAdvancedCommandOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        extractUploadAdvancedCommandDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setAdvancedCommandOpen = useCallback(
    (open: boolean) => {
      setAdvancedCommandOpenState(open);
      syncAdvancedCommandOpenToUrl(open);
    },
    [syncAdvancedCommandOpenToUrl],
  );

  useEffect(() => {
    setAdvancedCommandOpenState(
      parseExtractUploadAdvancedCommandOpenFromSearch(extractUploadAdvancedCommandOpenParam),
    );
  }, [extractUploadAdvancedCommandOpenParam]);

  return {
    productLine,
    extractorScriptDownloadUrl,
    validateDisclosureOpen,
    setValidateDisclosureOpen,
    advancedCommandOpen,
    setAdvancedCommandOpen,
    buyerPolishedShell,
    baselineLoading,
    hasBaselineArtifacts,
    extractorScriptVersion,
    extractorUpdateBanner,
    maxMb,
    extractUploadSteps,
    extractUploadEmphasizedStepId,
    upload,
    folderZip,
    demo,
  };
}

export type ExtractUploadPageClientViewModel = ReturnType<typeof useExtractUploadPageClient>;
