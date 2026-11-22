"use client";

import { useState } from "react";

import type { ApiProblemDetails } from "@/lib/api-problem";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type ExtractUploadUploadSuccess = {
  readonly packageId: string;
  readonly snapshotId: string | null;
};

export type UseExtractUploadUploadInput = {
  readonly associateRunId?: string | null;
  readonly onUploadAccepted?: (result: ExtractUploadUploadSuccess) => void;
};

export function useExtractUploadUpload(input: UseExtractUploadUploadInput = {}) {
  const associateRunId = input.associateRunId;
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);

  async function onUpload(file: File): Promise<ExtractUploadUploadSuccess | null> {
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const trimmedRunId = associateRunId?.trim() ?? "";
      const uploadPath =
        trimmedRunId.length > 0
          ? `/api/proxy/v1/azure-extractor/upload?runId=${encodeURIComponent(trimmedRunId)}`
          : "/api/proxy/v1/azure-extractor/upload";

      const response = await fetch(
        uploadPath,
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

        return null;
      }

      let receipt: { packageId?: unknown; snapshotId?: unknown } | null;
      try {
        receipt = JSON.parse(bodyText) as typeof receipt;
      } catch {
        receipt = null;
      }

      const acceptedPackageId = typeof receipt?.packageId === "string" ? receipt.packageId.trim() : "";
      if (acceptedPackageId.length === 0) {
        setPackageId(null);
        setUploadError({
          message: "The server response did not include an upload reference. Check your inventory before retrying.",
          problem: null,
          correlationId,
        });
        return null;
      }

      const snapshotId = typeof receipt?.snapshotId === "string" ? receipt.snapshotId.trim() : "";
      setPackageId(acceptedPackageId);
      const success = { packageId: acceptedPackageId, snapshotId: snapshotId.length > 0 ? snapshotId : null };
      input.onUploadAccepted?.(success);
      void getOperatorQueryClient().invalidateQueries({
        queryKey: operatorQueryKeys.extractUploadBaselineArtifacts,
      });

      return success;
    } finally {
      setBusy(false);
    }
  }

  function clearUploadState(): void {
    setUploadError(null);
    setPackageId(null);
  }

  return {
    busy,
    uploadError,
    packageId,
    onUpload,
    clearUploadState,
    setUploadError,
  };
}
