import { ensureOidcBearerReady, resolveRequest, withCorrelationHeaders } from "@/lib/api/http";

export type BulkEvidenceUploadProgress = {
  loadedBytes: number;
  totalBytes: number;
  percent: number;
};

export type BulkEvidenceUploadHttpResult = {
  status: number;
  bodyText: string;
};

function applyHeaders(xhr: XMLHttpRequest, headers: HeadersInit): void {
  const headerBag = new Headers(headers);

  headerBag.forEach((value, key) => {
    if (key.toLowerCase() === "content-type") {
      return;
    }

    xhr.setRequestHeader(key, value);
  });
}

/**
 * POST multipart evidence batch with upload progress (XHR — `fetch` does not expose upload progress).
 */
export async function postBulkEvidenceMultipartWithProgress(
  runId: string,
  files: File[],
  onProgress: (progress: BulkEvidenceUploadProgress) => void,
  signal?: AbortSignal,
): Promise<BulkEvidenceUploadHttpResult> {
  await ensureOidcBearerReady();

  const path = `/v1/architecture/run/${encodeURIComponent(runId)}/evidence/bulk`;
  const { url, headers } = resolveRequest(path);
  const requestHeaders = withCorrelationHeaders(headers);

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const onAbort = (): void => {
      xhr.abort();
    };

    if (signal !== undefined) {
      if (signal.aborted) {
        reject(new DOMException("Upload aborted", "AbortError"));

        return;
      }

      signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const totalBytes = event.total;
      const loadedBytes = event.loaded;
      const percent = totalBytes > 0 ? Math.min(100, (loadedBytes / totalBytes) * 100) : 0;

      onProgress({ loadedBytes, totalBytes, percent });
    });

    xhr.addEventListener("load", () => {
      if (signal !== undefined) {
        signal.removeEventListener("abort", onAbort);
      }

      resolve({
        status: xhr.status,
        bodyText: xhr.responseText ?? "",
      });
    });

    xhr.addEventListener("error", () => {
      if (signal !== undefined) {
        signal.removeEventListener("abort", onAbort);
      }

      reject(new Error("Network error during evidence upload."));
    });

    xhr.addEventListener("abort", () => {
      if (signal !== undefined) {
        signal.removeEventListener("abort", onAbort);
      }

      reject(new DOMException("Upload aborted", "AbortError"));
    });

    xhr.open("POST", url);
    applyHeaders(xhr, requestHeaders);
    xhr.send(formData);
  });
}
