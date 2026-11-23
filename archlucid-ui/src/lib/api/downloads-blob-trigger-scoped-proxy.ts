import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { scopedProxyDownloadBlockedReason } from "@/lib/api/scoped-proxy-download-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import {
  ensureOidcBearerReady,
  isBrowser,
} from "./http";
import {
  fetchBrowserDownload,
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob-trigger-browser";
import { assertBinaryDownloadContentType } from "./downloads-blob-trigger-guard";

export type ScopedProxyFileGetOptions = {
  readonly accept: string;
  readonly defaultFileName?: string;
  readonly expectedContentTypePrefixes?: readonly string[];
  readonly resolveBlockedReason?: (failure: ApiLoadFailureState) => string | null;
};

function rejectUnguardedHtmlOrProblemDownload(response: Response): void {
  const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";

  if (contentType.includes("text/html") || contentType.includes("application/problem+json")) {
    throw new Error(`Download blocked: unexpected content type '${contentType || "unknown"}'.`);
  }
}

async function fetchScopedProxyFileGet(
  proxyUrl: string,
  options: ScopedProxyFileGetOptions,
): Promise<Response> {
  if (!isBrowser()) {
    throw new Error("Scoped proxy file GET is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const headers = new Headers();
  headers.set("Accept", options.accept);

  const init = mergeRegistrationScopeForProxy({
    method: "GET",
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const { response, correlationId } = await fetchBrowserDownload(proxyUrl, { ...init, method: "GET" });

  if (!response.ok) {
    const errText = await response.text();
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, errText, correlationId));
    const blockedReason =
      options.resolveBlockedReason?.(failure) ?? scopedProxyDownloadBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  const expectedPrefixes = options.expectedContentTypePrefixes ?? [];

  if (expectedPrefixes.length > 0) {
    assertBinaryDownloadContentType(response, [...expectedPrefixes]);
  } else {
    // JSON downloads omit prefixes because the binary guard rejects application/json.
    // A 200 HTML or problem document must still not be saved as the file.
    rejectUnguardedHtmlOrProblemDownload(response);
  }

  return response;
}

/** GET a scoped `/api/proxy` file and trigger a browser download. */
export async function downloadScopedProxyFileGet(
  proxyUrl: string,
  options: ScopedProxyFileGetOptions,
): Promise<void> {
  const response = await fetchScopedProxyFileGet(proxyUrl, options);
  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    options.defaultFileName ??
    "download";
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}

/** GET a scoped `/api/proxy` file and open the blob URL in a new tab. */
export async function openScopedProxyFileGetInNewTab(
  proxyUrl: string,
  options: ScopedProxyFileGetOptions,
): Promise<void> {
  const response = await fetchScopedProxyFileGet(proxyUrl, options);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  URL.revokeObjectURL(objectUrl);
}
