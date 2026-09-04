import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  ensureOidcBearerReady,
  getBearerToken,
  isBrowser,
  throwApiRequestError,
} from "./http";
import { getTerraformAdvisoryExportDownloadUrl } from "./downloads-blob-urls";
import {
  fetchBrowserDownload,
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob-trigger-browser";
import { assertBinaryDownloadContentType } from "./downloads-blob-trigger-guard";

/**
 * GET advisory Terraform ZIP (`ReadAuthority`, Standard+ tier on API). Browser-only download through the BFF proxy.
 */
export async function downloadTerraformAdvisoryExportZip(runId: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadTerraformAdvisoryExportZip is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const url = getTerraformAdvisoryExportDownloadUrl(runId);
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
    `archlucid-terraform-advisory-${runId}.zip`;
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}
