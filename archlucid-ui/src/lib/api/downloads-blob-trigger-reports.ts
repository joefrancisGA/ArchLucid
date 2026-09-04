import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  ensureOidcBearerReady,
  getBearerToken,
  isBrowser,
  throwApiRequestError,
} from "./http";

import type { ConsultingDocxExportBrandingPayload } from "./downloads-blob-urls";
import {
  fetchBrowserDownload,
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob-trigger-browser";
import { assertBinaryDownloadContentType } from "./downloads-blob-trigger-guard";

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

  assertBinaryDownloadContentType(response, [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

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

  assertBinaryDownloadContentType(response, ["application/pdf"]);

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

  assertBinaryDownloadContentType(response, ["application/pdf"]);

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `ArchLucid-board-pack-Q${quarter}-${year}.pdf`;
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}
