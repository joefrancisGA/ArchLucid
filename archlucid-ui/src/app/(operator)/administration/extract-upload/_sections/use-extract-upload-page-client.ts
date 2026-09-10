"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useExtractUploadBaselineQuery, extractorScriptCdnUrl } from "@/hooks/use-extract-upload-baseline-query";
import {
  extractUploadAdvancedCommandDisclosureHrefFromSearch,
  parseExtractUploadAdvancedCommandOpenFromSearch,
} from "@/lib/administration/extract-upload-advanced-command-disclosure-url";
import { resolveOperatorPrincipalOwnerLabel } from "@/lib/action-actor-display";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { countArchLucidAzurePackageResourcesFromFile } from "@/lib/count-arch-lucid-azure-package-resources";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  writeExtractUploadAcceptedPackageRecord,
  type ExtractUploadAcceptedPackageRecord,
} from "@/lib/extract-upload-accepted-package-record";
import {
  resolveExtractUploadHasInventoryOnFile,
  resolveExtractUploadPackageEmphasizedStepId,
  resolveExtractUploadPackageSteps,
} from "@/lib/extract-upload-package-checklist";
import { EXTRACT_UPLOAD_BASELINE_STATUS_PENDING_MESSAGE } from "@/lib/extract-upload-settings-page-copy";

import { useExtractUploadDemo } from "./use-extract-upload-demo";
import { useExtractUploadFolderZip } from "./use-extract-upload-folder-zip";
import { useExtractUploadUpload } from "./use-extract-upload-upload";

export type UseExtractUploadPageClientInput = {
  readonly router: AppRouterInstance;
  readonly pathname: string;
  readonly searchParams: Readonly<URLSearchParams>;
};

type PendingUploadRequest = {
  readonly file: File;
  readonly fileLabel: string;
};

export function useExtractUploadPageClient({ router, pathname, searchParams }: UseExtractUploadPageClientInput) {
  const extractUploadAdvancedCommandOpenParam = searchParams.get("extractUploadAdvancedCommandOpen");
  const associateRunId = searchParams.get("runId");
  const { productLine } = useProductLine();
  const { currentPrincipal } = useOperatorNavAuthority();
  const extractorScriptDownloadUrl = extractorScriptCdnUrl(productLine);
  const [validateDisclosureOpen, setValidateDisclosureOpen] = useState(false);
  const [advancedCommandOpen, setAdvancedCommandOpenState] = useState(() =>
    parseExtractUploadAdvancedCommandOpenFromSearch(extractUploadAdvancedCommandOpenParam),
  );
  const [selectedPlatform, setSelectedPlatform] = useState<CloudInventoryPlatform>("azure");
  const [baselineOverwriteOpen, setBaselineOverwriteOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUploadRequest | null>(null);
  const [replaceInventoryMode, setReplaceInventoryMode] = useState(false);
  const [sessionAcceptedPackage, setSessionAcceptedPackage] = useState<ExtractUploadAcceptedPackageRecord | null>(
    null,
  );
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const baselineQuery = useExtractUploadBaselineQuery(productLine);

  const persistAcceptedPackage = useCallback(
    async (packageId: string, fileLabel: string, file: File) => {
      const resourceCount = await countArchLucidAzurePackageResourcesFromFile(file);
      const actorLabel =
        resolveOperatorPrincipalOwnerLabel({
          name: currentPrincipal.name,
          meClaims: currentPrincipal.meClaims,
        }) ?? "Unknown";
      const record: ExtractUploadAcceptedPackageRecord = {
        packageId,
        acceptedAtUtc: new Date().toISOString(),
        actorLabel,
        resourceCount,
        fileLabel,
        associateRunId,
      };
      writeExtractUploadAcceptedPackageRecord(record);
      setSessionAcceptedPackage(record);
      setReplaceInventoryMode(false);
    },
    [associateRunId, currentPrincipal.meClaims, currentPrincipal.name],
  );

  const upload = useExtractUploadUpload({
    associateRunId,
  });

  const executeUpload = useCallback(
    async (request: PendingUploadRequest) => {
      const result = await upload.onUpload(request.file);

      if (result !== null) {
        await persistAcceptedPackage(result.packageId, request.fileLabel, request.file);
      }
    },
    [persistAcceptedPackage, upload],
  );

  const gateUpload = useCallback(
    (request: PendingUploadRequest) => {
      if (baselineQuery.isPending) {
        upload.setUploadError({
          message: EXTRACT_UPLOAD_BASELINE_STATUS_PENDING_MESSAGE,
          problem: null,
          correlationId: null,
        });

        return;
      }

      const hasBaselineArtifacts = baselineQuery.data?.hasBaselineArtifacts ?? null;

      if (hasBaselineArtifacts === true && !replaceInventoryMode) {
        setPendingUpload(request);
        setBaselineOverwriteOpen(true);

        return;
      }

      void executeUpload(request);
    },
    [baselineQuery.data?.hasBaselineArtifacts, baselineQuery.isPending, executeUpload, replaceInventoryMode, upload],
  );

  const folderZip = useExtractUploadFolderZip({
    onUpload: async (file, fileLabel) => {
      gateUpload({ file, fileLabel });
    },
    clearUploadState: upload.clearUploadState,
    setUploadError: upload.setUploadError,
  });

  const demo = useExtractUploadDemo({
    router,
    pathname,
    searchParams,
    onUpload: async (file, fileLabel) => {
      gateUpload({ file, fileLabel });
    },
    clearUploadState: upload.clearUploadState,
    setUploadError: upload.setUploadError,
    clearSelectionState: folderZip.clearSelectionState,
    setSelectedFileLabel: folderZip.setSelectedFileLabel,
  });

  const confirmBaselineOverwrite = useCallback(() => {
    setBaselineOverwriteOpen(false);

    if (pendingUpload === null) {
      return;
    }

    const request = pendingUpload;
    setPendingUpload(null);
    void executeUpload(request);
  }, [executeUpload, pendingUpload]);

  const cancelBaselineOverwrite = useCallback(() => {
    setBaselineOverwriteOpen(false);
    setPendingUpload(null);
    folderZip.clearSelectionState();
  }, [folderZip]);

  const baselineLoading = baselineQuery.isPending;
  const hasBaselineArtifacts = baselineQuery.data?.hasBaselineArtifacts ?? null;
  const hasInventoryOnFile = resolveExtractUploadHasInventoryOnFile({
    hasBaselineArtifacts,
    packageId: upload.packageId,
  });
  const extractorScriptVersion = baselineQuery.data?.extractorScriptVersion ?? null;
  const extractorUpdateBanner = baselineQuery.data?.extractorUpdateBanner ?? null;
  const extractorScriptSha256 = baselineQuery.data?.extractorScriptSha256 ?? null;
  const lastAcceptedPackage =
    sessionAcceptedPackage ?? baselineQuery.data?.lastAcceptedPackage ?? null;
  const packageAccepted = upload.packageId !== null;
  const showAcceptedDropZone = packageAccepted && !replaceInventoryMode;
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));
  const extractUploadSteps = useMemo(
    () =>
      resolveExtractUploadPackageSteps({
        providerSelected: true,
        packageAccepted,
        inventoryParsed: hasBaselineArtifacts === true,
      }),
    [hasBaselineArtifacts, packageAccepted],
  );
  const extractUploadEmphasizedStepId = useMemo(
    () =>
      resolveExtractUploadPackageEmphasizedStepId({
        providerSelected: true,
        packageAccepted,
        inventoryParsed: hasBaselineArtifacts === true,
      }),
    [hasBaselineArtifacts, packageAccepted],
  );

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

  const beginReplaceInventory = useCallback(() => {
    upload.clearUploadState();
    folderZip.clearSelectionState();
    setReplaceInventoryMode(true);
  }, [folderZip, upload]);

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
    hasInventoryOnFile,
    extractorScriptVersion,
    extractorUpdateBanner,
    extractorScriptSha256,
    lastAcceptedPackage,
    associateRunId,
    selectedPlatform,
    setSelectedPlatform,
    maxMb,
    extractUploadSteps,
    extractUploadEmphasizedStepId,
    upload,
    folderZip,
    demo,
    baselineOverwriteOpen,
    setBaselineOverwriteOpen,
    confirmBaselineOverwrite,
    cancelBaselineOverwrite,
    showAcceptedDropZone,
    beginReplaceInventory,
    replaceInventoryMode,
  };
}

export type ExtractUploadPageClientViewModel = ReturnType<typeof useExtractUploadPageClient>;
