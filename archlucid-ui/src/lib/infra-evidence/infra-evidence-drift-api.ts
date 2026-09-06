import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { proxyJsonGet } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  ensureOidcBearerReady,
  getBearerToken,
  isBrowser,
  throwApiRequestError,
} from "@/lib/api/http";
import {
  fetchBrowserDownload,
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "@/lib/api/downloads-blob-trigger-browser";
import { assertBinaryDownloadContentType } from "@/lib/api/downloads-blob-trigger-guard";
import type {
  InfraEvidenceBaselineRecord,
  InfraEvidenceDiffChange,
  InfraEvidenceDiffSummary,
  InfraEvidencePagedResponse,
  InfraEvidenceSnapshotSummary,
} from "@/lib/infra-evidence/infra-evidence-drift-types";

const SNAPSHOTS_PATH = "/api/proxy/v1/infra-evidence/snapshots";
const DIFFS_PATH = "/api/proxy/v1/infra-evidence/diffs";
const BASELINES_PATH = "/api/proxy/v1/infra-evidence/azure-inventory/baselines";

export async function fetchInfraEvidenceSnapshots(
  page = 1,
  pageSize = 50,
  subscriptionId?: string | null,
): Promise<InfraEvidencePagedResponse<InfraEvidenceSnapshotSummary>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  if (subscriptionId != null && subscriptionId.trim().length > 0) {
    params.set("subscriptionId", subscriptionId.trim());
  }

  return proxyJsonGet<InfraEvidencePagedResponse<InfraEvidenceSnapshotSummary>>(
    `${SNAPSHOTS_PATH}?${params.toString()}`,
  );
}

export async function fetchInfraEvidenceDiffsForSnapshot(
  snapshotId: string,
): Promise<InfraEvidenceDiffSummary[]> {
  return proxyJsonGet<InfraEvidenceDiffSummary[]>(`${SNAPSHOTS_PATH}/${snapshotId}/diffs`);
}

export async function fetchInfraEvidenceDiffChanges(
  diffId: string,
  page = 1,
  pageSize = 50,
  options: { readonly cloudResourceId?: string | null } = {},
): Promise<InfraEvidencePagedResponse<InfraEvidenceDiffChange>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  if (options.cloudResourceId != null && options.cloudResourceId.trim().length > 0) {
    params.set("cloudResourceId", options.cloudResourceId.trim());
  }

  return proxyJsonGet<InfraEvidencePagedResponse<InfraEvidenceDiffChange>>(
    `${DIFFS_PATH}/${diffId}/changes?${params.toString()}`,
  );
}

export async function fetchInfraEvidenceBaselines(
  subscriptionId?: string | null,
): Promise<InfraEvidenceBaselineRecord[]> {
  const params = subscriptionId != null && subscriptionId.trim().length > 0
    ? `?subscriptionId=${encodeURIComponent(subscriptionId.trim())}`
    : "";

  return proxyJsonGet<InfraEvidenceBaselineRecord[]>(`${BASELINES_PATH}${params}`);
}

/** Downloads IE-05 advisory Terraform ZIP for a snapshot (reconstruction honesty bundle). */
export async function downloadInfraEvidenceTerraformAdvisoryZip(snapshotId: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadInfraEvidenceTerraformAdvisoryZip is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const url = `${SNAPSHOTS_PATH}/${snapshotId}/terraform-advisory`;
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
    `terraform-advisory-${snapshotId}.zip`;
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}

export function formatInfraEvidenceApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return toApiLoadFailure(error).message;
}
