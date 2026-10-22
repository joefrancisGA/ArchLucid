import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { readArchLucidAzurePackageZipFromFile } from "@/lib/read-arch-lucid-azure-package-zip";

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

export type UploadAzureExtractorPackageOptions = {
  readonly runId?: string | null;
  /** Optional 0–100 progress callback (uses XMLHttpRequest when provided). */
  readonly onUploadProgress?: (percent: number) => void;
};

async function uploadAzureExtractorPackageWithFetch(
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

async function uploadAzureExtractorPackageWithProgress(
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
      reject(new Error("Azure extractor upload failed."));
    };

    xhr.send(formData);
  });
}

export async function uploadAzureExtractorPackage(
  file: File,
  options?: UploadAzureExtractorPackageOptions,
): Promise<UploadAzureExtractorPackageResult> {
  const validation = await readArchLucidAzurePackageZipFromFile(file);

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

  const runId = options?.runId?.trim();
  const query = runId !== undefined && runId.length > 0 ? `?runId=${encodeURIComponent(runId)}` : "";
  const url = `/api/proxy/v1/azure-extractor/upload${query}`;

  const transport =
    options?.onUploadProgress !== undefined
      ? await uploadAzureExtractorPackageWithProgress(url, formData, options.onUploadProgress)
      : await uploadAzureExtractorPackageWithFetch(url, formData);

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
