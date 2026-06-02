import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type UploadAzureExtractorPackageSuccess = {
  ok: true;
  packageId: string | null;
};

export type UploadAzureExtractorPackageFailure = {
  ok: false;
  message: string;
  problem: ApiProblemDetails | null;
  correlationId: string | null;
};

export type UploadAzureExtractorPackageResult =
  | UploadAzureExtractorPackageSuccess
  | UploadAzureExtractorPackageFailure;

export async function uploadAzureExtractorPackage(
  file: File,
  options?: { readonly runId?: string | null },
): Promise<UploadAzureExtractorPackageResult> {
  const formData = new FormData();
  formData.append("file", file);

  const runId = options?.runId?.trim();
  const query = runId !== undefined && runId.length > 0 ? `?runId=${encodeURIComponent(runId)}` : "";
  const response = await fetch(
    `/api/proxy/v1/azure-extractor/upload${query}`,
    mergeRegistrationScopeForProxy({
      method: "POST",
      body: formData,
    }),
  );

  const bodyText = await response.text();
  const correlationId = response.headers.get("X-Correlation-ID");

  if (!response.ok) {
    const apiError = buildApiRequestErrorFromParts(response, bodyText);

    return {
      ok: false,
      message: apiError.message,
      problem: apiError.problem,
      correlationId: apiError.correlationId ?? correlationId,
    };
  }

  try {
    const payload = JSON.parse(bodyText) as { packageId?: string | null };

    return { ok: true, packageId: payload.packageId ?? null };
  } catch {
    return { ok: true, packageId: null };
  }
}
