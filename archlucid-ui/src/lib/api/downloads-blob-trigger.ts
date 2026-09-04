import { captureTraceContextFromResponse } from "@/lib/correlation";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  applyCorrelationHeaders,
  ensureOidcBearerReady,
  getBearerToken,
  isBrowser,
  throwApiRequestError,
} from "./http";

import type { ConsultingDocxExportBrandingPayload } from "./downloads-blob-urls";
import { getTerraformAdvisoryExportDownloadUrl } from "./downloads-blob-urls";

export async function fetchBrowserDownload(
  url: string,
  init: RequestInit,
): Promise<{ response: Response; correlationId: string }> {
  const { headers, correlationId } = applyCorrelationHeaders(new Headers(init.headers));
  const response = await fetch(url, { ...init, headers });
  captureTraceContextFromResponse(response);

  return { response, correlationId };
}

export function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const m = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);

  return m?.[1]?.replace(/"/g, "").trim() ?? null;
}

export async function triggerBrowserBlobDownload(blob: Blob, fileName: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

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

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `archlucid-terraform-advisory-${runId}.zip`;
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}

/**
 * POST consulting-template architecture analysis DOCX (`CanExportConsultingDocx` / `export:consulting-docx`).
 * Browser-only download; API returns `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
 */
export async function downloadConsultingArchitectureReportDocx(
  runId: string,
  branding?: ConsultingDocxExportBrandingPayload | null,
): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadConsultingArchitectureReportDocx is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const path = `/v1/architecture/review/${encodeURIComponent(runId)}/analysis-report/export/docx/consulting`;
  const url = `/api/proxy${path}`;
  const headers = new Headers();
  headers.set(
    "Accept",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json",
  );
  headers.set("Content-Type", "application/json");
  const bearer = getBearerToken();

  if (bearer) {
    headers.set("Authorization", `Bearer ${bearer}`);
  }

  const bodyPayload: Record<string, unknown> = {};

  if (branding?.reviewBoardWhitelabelFirmDisplayName?.trim()) {
    bodyPayload.reviewBoardWhitelabelFirmDisplayName = branding.reviewBoardWhitelabelFirmDisplayName.trim();
  }

  if (branding?.reviewBoardWhitelabelClientEngagementTitle?.trim()) {
    bodyPayload.reviewBoardWhitelabelClientEngagementTitle = branding.reviewBoardWhitelabelClientEngagementTitle.trim();
  }

  if (
    branding?.reviewBoardWhitelabelLogoBase64 !== undefined &&
    branding.reviewBoardWhitelabelLogoBase64 !== null &&
    branding.reviewBoardWhitelabelLogoBase64.trim().length > 0
  ) {
    bodyPayload.reviewBoardWhitelabelLogoBase64 = branding.reviewBoardWhitelabelLogoBase64.trim();
  }

  const init = mergeRegistrationScopeForProxy({
    method: "POST",
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(bodyPayload),
  });
  const { response, correlationId } = await fetchBrowserDownload(url, { ...init, method: "POST" });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText, correlationId);
  }

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `analysis-report-consulting-${runId}.docx`;
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}

/**
 * POST `/v1/pilots/runs/{runId}/first-value-report.pdf` and trigger a browser download of the resulting PDF.
 */
export async function downloadFirstValueReportPdf(runId: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadFirstValueReportPdf is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const path = `/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report.pdf`;
  const url = `/api/proxy${path}`;
  const headers = new Headers();
  headers.set("Accept", "application/pdf, application/json");
  const bearer = getBearerToken();
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  const init = mergeRegistrationScopeForProxy({
    method: "POST",
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const { response, correlationId } = await fetchBrowserDownload(url, { ...init, method: "POST" });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText, correlationId);
  }

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `ArchLucid-first-value-report-${runId}.pdf`;
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}

/**
 * POST `/v1/pilots/board-pack.pdf` — quarterly sponsor PDF (`ExecuteAuthority`, Standard+ tier on API).
 * Browser-only download.
 */
export async function downloadBoardPackPdf(year: number, quarter: number): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadBoardPackPdf is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const path = "/v1/pilots/board-pack.pdf";
  const url = `/api/proxy${path}`;
  const headers = new Headers();
  headers.set("Accept", "application/pdf, application/json");
  headers.set("Content-Type", "application/json");
  const bearer = getBearerToken();
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  const init = mergeRegistrationScopeForProxy({
    method: "POST",
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ year, quarter }),
  });
  const { response, correlationId } = await fetchBrowserDownload(url, { ...init, method: "POST" });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText, correlationId);
  }

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `ArchLucid-board-pack-Q${quarter}-${year}.pdf`;
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}

type ScopedProxyFileGetOptions = {
  readonly accept: string;
  readonly defaultFileName: string;
};

async function fetchScopedProxyFileGet(url: string, options: ScopedProxyFileGetOptions): Promise<Blob> {
  if (!isBrowser()) {
    throw new Error("fetchScopedProxyFileGet is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const headers = new Headers();
  headers.set("Accept", options.accept);
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
  const { response, correlationId } = await fetchBrowserDownload(url, init);

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText, correlationId);
  }

  return response.blob();
}

/** GET a same-origin `/api/proxy/*` file with operator scope headers and trigger a browser download. */
export async function downloadScopedProxyFileGet(
  url: string,
  options: ScopedProxyFileGetOptions,
): Promise<void> {
  const blob = await fetchScopedProxyFileGet(url, options);
  await triggerBrowserBlobDownload(blob, options.defaultFileName);
}

/** GET a same-origin `/api/proxy/*` file with operator scope headers and open it in a new tab. */
export async function openScopedProxyFileGetInNewTab(
  url: string,
  options: Pick<ScopedProxyFileGetOptions, "accept">,
): Promise<void> {
  const blob = await fetchScopedProxyFileGet(url, options);
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  URL.revokeObjectURL(objectUrl);

  if (opened === null) {
    throw new Error("Pop-up blocked. Allow pop-ups to open this export in a new tab.");
  }
}
