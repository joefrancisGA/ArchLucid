import { CORRELATION_ID_HEADER, generateCorrelationId } from "@/lib/correlation";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  ensureOidcBearerReady,
  getBearerToken,
  isBrowser,
  resolveRequest,
  throwApiRequestError,
  withCorrelationHeaders,
} from "./http";

export function getArtifactDownloadUrl(manifestId: string, artifactId: string): string {
  return `/api/proxy/v1/artifacts/manifests/${manifestId}/artifact/${artifactId}`;
}

/** Returns the proxy URL for downloading the full artifact bundle ZIP for a manifest. */
export function getBundleDownloadUrl(manifestId: string): string {
  return `/api/proxy/v1/artifacts/manifests/${manifestId}/bundle`;
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
  const h = new Headers(init.headers);
  h.set(CORRELATION_ID_HEADER, generateCorrelationId());
  const response = await fetch(url, { ...init, method: "GET", headers: h });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText);
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

/** Returns the proxy URL for the traceability ZIP (run summary + audit slice + decision traces, size-capped on API). */
export function getTraceabilityBundleDownloadUrl(runId: string): string {
  return `/api/proxy/v1/architecture/run/${encodeURIComponent(runId)}/traceability-bundle.zip`;
}

/**
 * POST consulting-template architecture analysis DOCX (`CanExportConsultingDocx` / `export:consulting-docx`).
 * Browser-only download; API returns `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
 */
export async function downloadConsultingArchitectureReportDocx(runId: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadConsultingArchitectureReportDocx is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const path = `/v1/architecture/run/${encodeURIComponent(runId)}/analysis-report/export/docx/consulting`;
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

  const init = mergeRegistrationScopeForProxy({
    method: "POST",
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({}),
  });
  const h = new Headers(init.headers);
  h.set(CORRELATION_ID_HEADER, generateCorrelationId());
  const response = await fetch(url, { ...init, method: "POST", headers: h });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText);
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
  const h = new Headers(init.headers);
  h.set(CORRELATION_ID_HEADER, generateCorrelationId());
  const response = await fetch(url, { ...init, method: "POST", headers: h });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText);
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
  const h = new Headers(init.headers);
  h.set(CORRELATION_ID_HEADER, generateCorrelationId());
  const response = await fetch(url, { ...init, method: "POST", headers: h });

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText);
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
export async function downloadValueReportDocx(
  tenantId: string,
  fromIso: string,
  toIso: string,
): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadValueReportDocx is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const path = `/v1/value-report/${encodeURIComponent(tenantId)}/generate?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;
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
  const h = new Headers(init.headers);
  h.set(CORRELATION_ID_HEADER, generateCorrelationId());
  const response = await fetch(url, { ...init, method: "POST", headers: h });

  if (response.status === 202) {
    throw new Error(
      "Large reporting window: async generation started. Open Enterprise Controls → Value report to poll the job.",
    );
  }

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText);
  }

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `ArchLucid-value-report-${tenantId}.docx`;
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
