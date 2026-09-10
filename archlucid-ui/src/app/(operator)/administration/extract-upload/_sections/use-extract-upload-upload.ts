"use client";

import { useState } from "react";

import type { ApiProblemDetails } from "@/lib/api-problem";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type ExtractUploadUploadSuccess = {
  readonly packageId: string;
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
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  async function onUpload(file: File): Promise<ExtractUploadUploadSuccess | null> {
    setBusy(true);
    setUploadSuccessMessage(null);

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

      let acceptedPackageId: string | null = null;

      try {
        const payload = JSON.parse(bodyText) as { packageId?: string };
        acceptedPackageId = payload.packageId?.trim() ?? null;
        setPackageId(acceptedPackageId);
      } catch {
        setPackageId(null);
      }

      if (acceptedPackageId !== null) {
        setUploadSuccessMessage(acceptedPackageId);
        const success = { packageId: acceptedPackageId };
        input.onUploadAccepted?.(success);
        void getOperatorQueryClient().invalidateQueries({
          queryKey: operatorQueryKeys.extractUploadBaselineArtifacts,
        });

        return success;
      }

      return null;
    } finally {
      setBusy(false);
    }
  }

  function clearUploadState(): void {
    setUploadError(null);
    setPackageId(null);
    setUploadSuccessMessage(null);
  }

  return {
    busy,
    uploadError,
    packageId,
    uploadSuccessMessage,
    onUpload,
    clearUploadState,
    setUploadError,
  };
}
