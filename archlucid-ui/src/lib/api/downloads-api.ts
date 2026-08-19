import { captureTraceContextFromResponse } from "@/lib/correlation";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  apiPostNoContent,
  applyCorrelationHeaders,
  ensureOidcBearerReady,
  getBearerToken,
  isBrowser,
  throwApiRequestError,
} from "./http";

async function fetchBrowserDownload(
  url: string,
  init: RequestInit,
): Promise<{ response: Response; correlationId: string }> {
  const { headers, correlationId } = applyCorrelationHeaders(new Headers(init.headers));
  const response = await fetch(url, { ...init, headers });
  captureTraceContextFromResponse(response);

  return { response, correlationId };
}

export function getArtifactDownloadUrl(manifestId: string, artifactId: string): string {
  return `/api/proxy/v1/artifacts/signed-review-records/${manifestId}/artifact/${artifactId}`;
}

export type RunPackageExportFormat = "docx" | "pdf" | "html";

/**
 * Finalized architecture-review-board package export (`RunsExportController`).
 * Prefer this over {@link getArtifactDownloadUrl} with the profile token — artifact routes require a GUID id.
 */
export function getRunPackageExportUrl(runId: string, format: RunPackageExportFormat): string {
  return `/api/proxy/v1/runs/${encodeURIComponent(runId)}/export/${format}`;
}

/** Curated sample / static demo reviews have no backend-persisted export target. */
export const SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT =
  "Downloads aren't available for this sample review. Start a review with your own input to export a package.";

/** Returns the proxy URL for downloading the full artifact bundle ZIP for a manifest. */
export function getBundleDownloadUrl(manifestId: string): string {
  return `/api/proxy/v1/artifacts/signed-review-records/${manifestId}/bundle`;
}

/** Returns the proxy URL for the advisory Terraform placeholder export ZIP. */
export function getTerraformAdvisoryExportDownloadUrl(runId: string): string {
  return `/api/proxy/v1/artifacts/runs/${encodeURIComponent(runId)}/terraform-advisory-export`;
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
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

/** Returns the proxy URL for downloading the full run export ZIP. */
export function getRunExportDownloadUrl(runId: string): string {
  return `/api/proxy/v1/artifacts/runs/${runId}/export`;
}

/** Returns the proxy URL for the ADR 0052 decision receipt JSON on a committed infeasible run. */
export function getRunDecisionReceiptDownloadUrl(runId: string): string {
  return `/api/proxy/v1/artifacts/runs/${encodeURIComponent(runId)}/decision-receipt`;
}

/** Returns the proxy URL for the ADR 0052 decision receipt JSON on a redirected intake draft. */
export function getDraftDecisionReceiptDownloadUrl(draftId: string): string {
  return `/api/proxy/v1/architecture/draft/${encodeURIComponent(draftId)}/decision-receipt`;
}

/** Returns the proxy URL for the traceability ZIP (run summary + audit slice + decision traces, size-capped on API). */
export function getTraceabilityBundleDownloadUrl(runId: string): string {
  return `/api/proxy/v1/architecture/review/${encodeURIComponent(runId)}/traceability-bundle.zip`;
}

/** Returns the proxy URL for downloading the original ArchitectureRequest JSON. */
export function getArchitectureRequestDownloadUrl(requestId: string): string {
  return `/api/proxy/v1/architecture/request/${encodeURIComponent(requestId)}`;
}

export type ConsultingDocxExportBrandingPayload = {
  reviewBoardWhitelabelFirmDisplayName?: string;
  reviewBoardWhitelabelClientEngagementTitle?: string;
  reviewBoardWhitelabelLogoBase64?: string | null;
};

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
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

/**
 * POST `/v1/architecture/comparisons/{comparisonRecordId}/replay?format=pdf`
 * Browser-only download.
 */
export async function downloadComparisonReplayPdf(comparisonRecordId: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadComparisonReplayPdf is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const path = `/v1/architecture/comparisons/${encodeURIComponent(comparisonRecordId)}/replay?format=pdf`;
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
    body: JSON.stringify({}),
  });
  const { response, correlationId } = await fetchBrowserDownload(url, { ...init, method: "POST" });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText, correlationId);
  }

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `comparison-report-${comparisonRecordId}.pdf`;
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

/**
 * Creates a comparison record and downloads the PDF replay.
 */
export async function createAndDownloadComparisonPdf(leftRunId: string, rightRunId: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("createAndDownloadComparisonPdf is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const path = `/v1/architecture/review/compare/end-to-end/summary?leftRunId=${encodeURIComponent(leftRunId)}&rightRunId=${encodeURIComponent(rightRunId)}`;
  const url = `/api/proxy${path}`;
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  const bearer = getBearerToken();
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  const init = mergeRegistrationScopeForProxy({
    method: "POST",
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ persist: true }),
  });
  const { response, correlationId } = await fetchBrowserDownload(url, { ...init, method: "POST" });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText, correlationId);
  }

  const comparisonRecordId = response.headers.get("x-archlucid-comparison-record-id");
  if (!comparisonRecordId) {
    throw new Error("Failed to get comparisonRecordId from response headers.");
  }

  await downloadComparisonReplayPdf(comparisonRecordId);
}

/** DOCX package; optional compare + AI narrative flags. */
export function getArchitecturePackageDocxUrl(
  runId: string,
  compareWithRunId?: string,
  opts?: { explainRun?: boolean; includeComparisonExplanation?: boolean },
): string {
  const params = new URLSearchParams();
  if (compareWithRunId?.trim())
    params.set("compareWithRunId", compareWithRunId.trim());
  if (opts?.explainRun) params.set("explainRun", "true");
  if (opts?.includeComparisonExplanation === false)
    params.set("includeComparisonExplanation", "false");
  const q = params.toString();
  return `/api/proxy/v1/docx/runs/${runId}/architecture-package${q ? `?${q}` : ""}`;
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const m = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);

  return m?.[1]?.replace(/"/g, "").trim() ?? null;
}

/**
 * POST `/v1/pilots/runs/{runId}/first-value-report.pdf` and trigger a browser download of the resulting PDF
 * (sponsor-shareable projection of the canonical first-value-report Markdown). Mirrors the auth surface of
 * the Markdown sibling (`ReadAuthority`, no Standard-tier gate) so the post-commit CTA stays one-click.
 * Throws {@link ApiRequestError}-shaped error on non-2xx responses.
 */
/** POST `/v1/pilots/runs/{runId}/sponsor-pack-sent` — records sponsor delivery in the audit trail (TB-243). */
export async function markSponsorPackSent(
  runId: string,
  body?: { readonly recipientEmail?: string; readonly deliveryMethod?: string },
): Promise<void> {
  const path = `/v1/pilots/runs/${encodeURIComponent(runId)}/sponsor-pack-sent`;
  await apiPostNoContent(path, body ?? { deliveryMethod: "email" });
}

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
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
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
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

/** POST sponsor value report DOCX (`ExecuteAuthority`, Standard+ tier on API). Browser-only download. */
export async function downloadValueReportDocx(fromIso: string, toIso: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadValueReportDocx is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const path = `/v1/value-report/generate?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;
  const url = `/api/proxy${path}`;
  const headers = new Headers();
  headers.set(
    "Accept",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json",
  );
  const bearer = getBearerToken();
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  const init = mergeRegistrationScopeForProxy({
    method: "POST",
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const { response, correlationId } = await fetchBrowserDownload(url, { ...init, method: "POST" });

  if (response.status === 202) {
    throw new Error(
      "Large reporting window: async generation started. Open Enterprise Controls → Value report to poll the job.",
    );
  }

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText, correlationId);
  }

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    "ArchLucid-value-report.docx";
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
