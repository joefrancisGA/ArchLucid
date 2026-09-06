import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  ensureOidcBearerReady,
  isBrowser,
  throwApiRequestError,
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
};

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
    throwApiRequestError(response, errText, correlationId);
  }

  if (options.expectedContentTypePrefixes && options.expectedContentTypePrefixes.length > 0) {
    assertBinaryDownloadContentType(response, [...options.expectedContentTypePrefixes]);
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
