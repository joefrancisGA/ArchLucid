"use client";

import { useState } from "react";

import type { ApiProblemDetails } from "@/lib/api-problem";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export function useExtractUploadUpload() {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);

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
