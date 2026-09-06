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
  InfraEvidenceMermaidPreviewResponse,
  InfraEvidenceMermaidRenderResponse,
} from "@/lib/infra-evidence/infra-evidence-mermaid-types";

const SNAPSHOTS_PATH = "/api/proxy/v1/infra-evidence/snapshots";

export type InfraEvidenceMermaidRenderQuery = {
  readonly mode?: string | null;
  readonly fallbackKey?: string | null;
  readonly seedNodeId?: string | null;
};

function buildMermaidQuery(params: InfraEvidenceMermaidRenderQuery): string {
  const search = new URLSearchParams();

  if (params.mode != null && params.mode.trim().length > 0) {
    search.set("mode", params.mode.trim());
  }

  if (params.fallbackKey != null && params.fallbackKey.trim().length > 0) {
    search.set("fallbackKey", params.fallbackKey.trim());
  }

  if (params.seedNodeId != null && params.seedNodeId.trim().length > 0) {
    search.set("seedNodeId", params.seedNodeId.trim());
  }

  const query = search.toString();

  return query.length > 0 ? `?${query}` : "";
}

export async function fetchInfraEvidenceMermaidPreview(
  snapshotId: string,
): Promise<InfraEvidenceMermaidPreviewResponse> {
  return proxyJsonGet<InfraEvidenceMermaidPreviewResponse>(
    `${SNAPSHOTS_PATH}/${snapshotId}/mermaid/preview`,
  );
}

export async function fetchInfraEvidenceMermaidRender(
  snapshotId: string,
  query: InfraEvidenceMermaidRenderQuery,
): Promise<InfraEvidenceMermaidRenderResponse> {
  return proxyJsonGet<InfraEvidenceMermaidRenderResponse>(
    `${SNAPSHOTS_PATH}/${snapshotId}/mermaid${buildMermaidQuery(query)}`,
  );
}

export async function downloadInfraEvidenceMermaidPng(
  snapshotId: string,
  query: InfraEvidenceMermaidRenderQuery,
): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadInfraEvidenceMermaidPng is only supported in the browser.");
  }

  await ensureOidcBearerReady();
  const url = `${SNAPSHOTS_PATH}/${snapshotId}/mermaid/export.png${buildMermaidQuery(query)}`;
  const headers = new Headers();
  headers.set("Accept", "image/png, application/json");
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

  assertBinaryDownloadContentType(response, ["image/png"]);

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition"))
    ?? `infra-evidence-mermaid-${snapshotId}.png`;
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}

export function formatInfraEvidenceMermaidApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return toApiLoadFailure(error).message;
}
