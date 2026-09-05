import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { pulseOidcSessionKeepalive } from "@/hooks/use-oidc-session-keepalive";
import {
  ensureOidcBearerReady,
  getBearerToken,
  isBrowser,
  throwApiRequestError,
} from "./http";
import { getRunExportDownloadUrl } from "./downloads-blob-urls";
import {
  fetchBrowserDownload,
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob-trigger-browser";
import { assertBinaryDownloadContentType } from "./downloads-blob-trigger-guard";

/**
 * GET full run export ZIP (`ReadAuthority`). Browser-only download through the BFF proxy.
 */
export async function downloadRunExportZip(runId: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadRunExportZip is only supported in the browser.");
  }

  await pulseOidcSessionKeepalive();
  await ensureOidcBearerReady();
  const url = getRunExportDownloadUrl(runId);
  const headers = new Headers();
  headers.set("Accept", "application/zip, application/json");
  const bearer = getBearerToken();

  if (bearer) {
    headers.set("Authorization", `Bearer ${bearer}`);
  }

  const init = mergeRegistrationScopeForProxy({
    method: "GET",
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const { response, correlationId } = await fetchBrowserDownload(url, { ...init, method: "GET" });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText, correlationId);
  }

  assertBinaryDownloadContentType(response, ["application/zip"]);

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `archlucid-run-export-${runId}.zip`;
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}
