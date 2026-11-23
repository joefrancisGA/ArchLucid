import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { sponsorValueReportDocxMutationBlockedReason } from "@/lib/pilots/sponsor-value-report-docx-mutation-blocked-reason";
import { sponsorPackSentMutationBlockedReason } from "@/lib/pilots/sponsor-pack-sent-mutation-blocked-reason";

import { comparisonReplayMutationBlockedReason } from "@/lib/compare/comparison-replay-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import {
  encodeRequiredPathSegment,
  trimRequiredPathSegment,
  trimTextFields,
} from "./api-boundary-normalization";
import {
  apiPostNoContent,
  ensureOidcBearerReady,
  getBearerToken,
  isBrowser,
} from "./http";
import {
  fetchBrowserDownload,
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob";
import { assertBinaryDownloadContentType } from "./downloads-blob-trigger-guard";

/**
 * POST `/v1/architecture/comparisons/{comparisonRecordId}/replay?format=pdf`
 * Browser-only download.
 */
export async function downloadComparisonReplayPdf(comparisonRecordId: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadComparisonReplayPdf is only supported in the browser.");
  }

  const trimmedComparisonRecordId = trimRequiredPathSegment(comparisonRecordId, "comparisonRecordId");
  const encodedComparisonRecordId = encodeRequiredPathSegment(comparisonRecordId, "comparisonRecordId");

  await ensureOidcBearerReady();
  const path = `/v1/architecture/comparisons/${encodedComparisonRecordId}/replay?format=pdf`;
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
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, errText, correlationId));
    const blockedReason = comparisonReplayMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  assertBinaryDownloadContentType(response, ["application/pdf"]);

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `comparison-report-${trimmedComparisonRecordId}.pdf`;
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

  const encodedLeftRunId = encodeRequiredPathSegment(leftRunId, "leftRunId");
  const encodedRightRunId = encodeRequiredPathSegment(rightRunId, "rightRunId");

  await ensureOidcBearerReady();
  const path = `/v1/architecture/review/compare/end-to-end/summary?leftRunId=${encodedLeftRunId}&rightRunId=${encodedRightRunId}`;
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
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, errText, correlationId));
    const blockedReason = comparisonReplayMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
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
  const encodedRunId = encodeRequiredPathSegment(runId, "runId");
  const path = `/v1/pilots/runs/${encodedRunId}/sponsor-pack-sent`;
  const payload = body === undefined
    ? { deliveryMethod: "email" }
    : trimTextFields(body, ["recipientEmail", "deliveryMethod"]);

  try {
    await apiPostNoContent(path, payload);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = sponsorPackSentMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** POST sponsor value report DOCX (`ExecuteAuthority`, Standard+ tier on API). Browser-only download. */
export async function downloadValueReportDocx(fromIso: string, toIso: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadValueReportDocx is only supported in the browser.");
  }

  const trimmedFromIso = trimRequiredPathSegment(fromIso, "fromIso");
  const trimmedToIso = trimRequiredPathSegment(toIso, "toIso");

  await ensureOidcBearerReady();
  const path = `/v1/value-report/generate?from=${encodeURIComponent(trimmedFromIso)}&to=${encodeURIComponent(trimmedToIso)}`;
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
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, errText, correlationId));
    const blockedReason = sponsorValueReportDocxMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  assertBinaryDownloadContentType(response, [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    "ArchLucid-value-report.docx";
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}
