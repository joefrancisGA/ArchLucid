import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { readTier1InventoryPackageZipFromFile } from "@/lib/read-tier1-inventory-package-zip";

export type UploadTier1InventoryPackageSuccess = {
  ok: true;
  packageId: string | null;
};

export type UploadTier1InventoryPackageFailure = {
  ok: false;
  message: string;
  problem: ApiProblemDetails | null;
  correlationId: string | null;
};

export type UploadTier1InventoryPackageResult =
  | UploadTier1InventoryPackageSuccess
  | UploadTier1InventoryPackageFailure;

export type UploadTier1InventoryPackageOptions = {
  readonly runId?: string | null;
  /** Optional 0–100 progress callback (uses XMLHttpRequest when provided). */
  readonly onUploadProgress?: (percent: number) => void;
};

function resolveTier1InventoryUploadUrl(platform: CloudInventoryPlatform, runId?: string | null): string {
  const trimmedRunId = runId?.trim();
  const query =
    trimmedRunId !== undefined && trimmedRunId.length > 0 ? `?runId=${encodeURIComponent(trimmedRunId)}` : "";

  if (platform === "azure") {
    return `/api/proxy/v1/azure-extractor/upload${query}`;
  }

  return `/api/proxy/v1/extractor/${platform}/upload${query}`;
}

async function uploadTier1InventoryPackageWithFetch(
  url: string,
  formData: FormData,
): Promise<{ response: Response; bodyText: string; correlationId: string | null }> {
  const response = await fetch(
    url,
    mergeRegistrationScopeForProxy({
      method: "POST",
      body: formData,
    }),
  );
  const bodyText = await response.text();

  return {
    response,
    bodyText,
    correlationId: response.headers.get("X-Correlation-ID"),
  };
}

async function uploadTier1InventoryPackageWithProgress(
  url: string,
  formData: FormData,
  onUploadProgress: (percent: number) => void,
): Promise<{ response: Response; bodyText: string; correlationId: string | null }> {
  const scopeHeaders = mergeRegistrationScopeForProxy({ method: "POST", body: formData });
  const headerInit = scopeHeaders.headers ?? {};
  const resolvedHeaders =
    headerInit instanceof Headers ? Object.fromEntries(headerInit.entries()) : { ...headerInit };

  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    for (const [key, value] of Object.entries(resolvedHeaders)) {
      if (value !== undefined && value !== null) {
        xhr.setRequestHeader(key, String(value));
      }
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) {
        return;
      }

      onUploadProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      const responseHeaders = new Headers();
      const rawHeader = xhr.getAllResponseHeaders().trim();

      if (rawHeader.length > 0) {
        for (const line of rawHeader.split(/\r?\n/)) {
          const separator = line.indexOf(":");

          if (separator > 0) {
            responseHeaders.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
          }
        }
      }

      resolve({
        response: new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: responseHeaders,
        }),
        bodyText: xhr.responseText,
        correlationId: responseHeaders.get("X-Correlation-ID"),
      });
    };

    xhr.onerror = () => {
      reject(new Error("Inventory package upload failed."));
    };

    xhr.send(formData);
  });
}

export async function uploadTier1InventoryPackage(
  platform: CloudInventoryPlatform,
  file: File,
  options?: UploadTier1InventoryPackageOptions,
): Promise<UploadTier1InventoryPackageResult> {
  const validation = await readTier1InventoryPackageZipFromFile(file, platform);

  if (!validation.ok) {
    return {
      ok: false,
      message: validation.message,
      problem: null,
      correlationId: null,
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  const url = resolveTier1InventoryUploadUrl(platform, options?.runId);

  const transport =
    options?.onUploadProgress !== undefined
      ? await uploadTier1InventoryPackageWithProgress(url, formData, options.onUploadProgress)
      : await uploadTier1InventoryPackageWithFetch(url, formData);

  const { response, bodyText, correlationId } = transport;

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
