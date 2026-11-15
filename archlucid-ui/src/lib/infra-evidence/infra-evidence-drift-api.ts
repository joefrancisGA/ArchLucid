import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { proxyJsonDelete, proxyJsonGet } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { infraEvidenceDriftMutationBlockedReason } from "@/lib/infra-evidence/infra-evidence-drift-mutation-blocked-reason";
import { infraEvidenceSnapshotsLoadBlockedReason } from "@/lib/infra-evidence/infra-evidence-snapshots-load-blocked-reason";
import { formatInfraEvidenceSealedManifestAwareApiError } from "@/lib/infra-evidence/infra-evidence-sealed-manifest-conflict";
import {
  ensureOidcBearerReady,
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

function encodeRequiredPathSegment(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return encodeURIComponent(trimmed);
}

function mapPagedResponse<T>(
  raw: unknown,
  page: number,
  pageSize: number,
  mapItem: (item: Record<string, unknown>) => T,
): InfraEvidencePagedResponse<T> {
  const row = raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
  const items = Array.isArray(row.items)
    ? row.items.flatMap((item) => {
        if (item === null || typeof item !== "object" || Array.isArray(item)) {
          return [];
        }

        return [mapItem(item as Record<string, unknown>)];
      })
    : [];
  const totalCount = typeof row.totalCount === "number" && Number.isFinite(row.totalCount) && row.totalCount >= 0
    ? row.totalCount
    : items.length;

  return {
    items,
    totalCount,
    page: typeof row.page === "number" && Number.isFinite(row.page) && row.page >= 1 ? Math.floor(row.page) : page,
    pageSize:
      typeof row.pageSize === "number" && Number.isFinite(row.pageSize) && row.pageSize >= 1
        ? Math.floor(row.pageSize)
        : pageSize,
    hasMore: row.hasMore === true,
  };
}

export async function deleteInfraEvidenceSnapshot(snapshotId: string): Promise<void> {
  const trimmed = snapshotId.trim();

  if (trimmed.length === 0) {
    throw new Error("snapshotId is required.");
  }

  await proxyJsonDelete(`${SNAPSHOTS_PATH}/${encodeURIComponent(trimmed)}`);
}

export async function fetchInfraEvidenceSnapshots(
  page = 1,
  pageSize = 50,
  subscriptionId?: string | null,
): Promise<InfraEvidencePagedResponse<InfraEvidenceSnapshotSummary>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  if (subscriptionId != null && subscriptionId.trim().length > 0) {
    params.set("subscriptionId", subscriptionId.trim());
  }

  const raw = await proxyJsonGet<unknown>(
    `${SNAPSHOTS_PATH}?${params.toString()}`,
  );

  return mapPagedResponse(raw, page, pageSize, (row) => row as InfraEvidenceSnapshotSummary);
}

export async function fetchInfraEvidenceDiffsForSnapshot(
  snapshotId: string,
): Promise<InfraEvidenceDiffSummary[]> {
  const raw = await proxyJsonGet<unknown>(
    `${SNAPSHOTS_PATH}/${encodeRequiredPathSegment(snapshotId, "snapshotId")}/diffs`,
  );

  return Array.isArray(raw)
    ? raw.filter((item): item is InfraEvidenceDiffSummary =>
      item !== null && typeof item === "object" && !Array.isArray(item))
    : [];
}

export async function fetchInfraEvidenceSnapshotInventoryRows(
  snapshotId: string,
  page = 1,
  pageSize = 50,
  options: { readonly cloudResourceId?: string | null } = {},
): Promise<InfraEvidencePagedResponse<InfraEvidenceDiffChange>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  if (options.cloudResourceId != null && options.cloudResourceId.trim().length > 0) {
    params.set("cloudResourceId", options.cloudResourceId.trim());
  }

  const raw = await proxyJsonGet<unknown>(
    `${SNAPSHOTS_PATH}/${encodeRequiredPathSegment(snapshotId, "snapshotId")}/inventory-rows?${params.toString()}`,
  );

  return mapPagedResponse(raw, page, pageSize, (row) => row as InfraEvidenceDiffChange);
}

export async function fetchInfraEvidenceDiffChanges(
  diffId: string,
  page = 1,
  pageSize = 50,
  options: { readonly cloudResourceId?: string | null; readonly includeUnchanged?: boolean } = {},
): Promise<InfraEvidencePagedResponse<InfraEvidenceDiffChange>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  if (options.cloudResourceId != null && options.cloudResourceId.trim().length > 0) {
    params.set("cloudResourceId", options.cloudResourceId.trim());
  }

  if (options.includeUnchanged === true) {
    params.set("includeUnchanged", "true");
  }

  const raw = await proxyJsonGet<unknown>(
    `${DIFFS_PATH}/${encodeRequiredPathSegment(diffId, "diffId")}/changes?${params.toString()}`,
  );

  return mapPagedResponse(raw, page, pageSize, (row) => row as InfraEvidenceDiffChange);
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
  const url = `${SNAPSHOTS_PATH}/${encodeRequiredPathSegment(snapshotId, "snapshotId")}/terraform-advisory`;
  const headers = new Headers();
  headers.set("Accept", "application/zip, application/json");

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
  const failure = toApiLoadFailure(error);
  const blockedReason =
    infraEvidenceSnapshotsLoadBlockedReason(failure)
    ?? infraEvidenceDriftMutationBlockedReason(failure);

  if (blockedReason !== null) {
    return blockedReason;
  }

  return formatInfraEvidenceSealedManifestAwareApiError(error);
}
