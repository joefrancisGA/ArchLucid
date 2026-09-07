import type { components } from "@/lib/api-types";

import { apiGet, ensureOidcBearerReady, resolveBinaryGetRequest, throwApiRequestError, withCorrelationHeaders } from "@/lib/api/http";
import type { RunStoredEvidenceCatalogEntry } from "@/lib/runs/run-detail-evidence-inventory";

export type RunStoredEvidenceFileDto = components["schemas"]["RunStoredEvidenceFileDto"];

export function mapRunStoredEvidenceCatalogEntry(
  dto: RunStoredEvidenceFileDto,
): RunStoredEvidenceCatalogEntry {
  return {
    evidenceItemId: dto.evidenceItemId ?? "",
    originalFileName: dto.originalFileName ?? "",
    contentType: dto.contentType ?? undefined,
  };
}

export async function listRunStoredEvidenceFiles(runId: string): Promise<readonly RunStoredEvidenceCatalogEntry[]> {
  const files = await apiGet<RunStoredEvidenceFileDto[]>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/evidence/files`,
  );

  return files.map(mapRunStoredEvidenceCatalogEntry);
}

export function buildRunStoredEvidenceFilePath(
  runId: string,
  evidenceItemId: string,
  disposition: "inline" | "attachment",
): string {
  const params = new URLSearchParams({ disposition });

  return `/v1/architecture/review/${encodeURIComponent(runId)}/evidence/files/${encodeURIComponent(evidenceItemId)}?${params.toString()}`;
}

function parseContentDispositionFileName(disposition: string | null, fallback: string): string {
  const fileNameMatch = /filename="?([^";]+)"?/i.exec(disposition ?? "");

  return fileNameMatch?.[1] ?? fallback;
}

export async function fetchRunStoredEvidenceFileBlob(
  runId: string,
  evidenceItemId: string,
  disposition: "inline" | "attachment",
): Promise<{ readonly blob: Blob; readonly fileName: string; readonly contentType: string }> {
  await ensureOidcBearerReady();

  const path = buildRunStoredEvidenceFilePath(runId, evidenceItemId, disposition);
  const { url, headers } = await resolveBinaryGetRequest(path);
  const requestHeaders = withCorrelationHeaders(new Headers(headers));
  const response = await fetch(url, { cache: "no-store", headers: requestHeaders });

  if (!response.ok) {
    const text = await response.text();
    throwApiRequestError(response, text);
  }

  const blob = await response.blob();
  const contentType = response.headers.get("content-type") ?? blob.type ?? "application/octet-stream";
  const fileName = parseContentDispositionFileName(
    response.headers.get("Content-Disposition"),
    evidenceItemId,
  );

  return { blob, fileName, contentType };
}

export async function downloadRunStoredEvidenceFile(
  runId: string,
  evidenceItemId: string,
  fallbackFileName: string,
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadRunStoredEvidenceFile is only available in the browser.");
  }

  const { blob, fileName } = await fetchRunStoredEvidenceFileBlob(runId, evidenceItemId, "attachment");
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName.length > 0 ? fileName : fallbackFileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
