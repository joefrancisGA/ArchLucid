import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  apiPostNoContent,
  ensureOidcBearerReady,
  isBrowser,
  throwApiRequestError,
} from "./http";
import {
  fetchBrowserDownload,
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob";

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
  await triggerBrowserBlobDownload(blob, fileName);
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

/** POST `/v1/pilots/runs/{runId}/sponsor-pack-sent` — records sponsor delivery in the audit trail (TB-243). */
export async function markSponsorPackSent(
  runId: string,
  body?: { readonly recipientEmail?: string; readonly deliveryMethod?: string },
): Promise<void> {
  const path = `/v1/pilots/runs/${encodeURIComponent(runId)}/sponsor-pack-sent`;
  await apiPostNoContent(path, body ?? { deliveryMethod: "email" });
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
  await triggerBrowserBlobDownload(blob, fileName);
}
