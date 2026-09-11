import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { proxyJsonGet } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  exportMermaidSourceToPngBlob,
  exportSanitizedMermaidSvgMarkupToPngBlob,
} from "@/lib/infra-evidence/export-mermaid-source-to-png";
import { infraEvidenceMermaidMutationBlockedReason } from "@/lib/infra-evidence/infra-evidence-mermaid-mutation-blocked-reason";
import { isInfraEvidenceMermaidServerPngUnavailableError } from "@/lib/infra-evidence/infra-evidence-mermaid-png-unavailable";
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
  InfraEvidenceMermaidPreviewResponse,
  InfraEvidenceMermaidRenderResponse,
} from "@/lib/infra-evidence/infra-evidence-mermaid-types";

const SNAPSHOTS_PATH = "/api/proxy/v1/infra-evidence/snapshots";

export type InfraEvidenceMermaidRenderQuery = {
  readonly mode?: string | null;
  readonly fallbackKey?: string | null;
  readonly seedNodeId?: string | null;
};

export type InfraEvidenceMermaidPngDownloadOptions = {
  readonly fallbackMermaidSource?: string | null;
  readonly fallbackSvgMarkup?: string | null;
  readonly dark?: boolean;
};

export type InfraEvidenceMermaidPngDownloadResult = {
  readonly usedBrowserFallback: boolean;
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

function buildInfraEvidenceMermaidPngFileName(snapshotId: string, query: InfraEvidenceMermaidRenderQuery): string {
  const modeToken = query.fallbackKey?.trim()
    || query.mode?.trim()
    || "diagram";

  return `infra-evidence-mermaid-${snapshotId}-${modeToken}.png`;
}

async function downloadInfraEvidenceMermaidPngFromServer(
  snapshotId: string,
  query: InfraEvidenceMermaidRenderQuery,
): Promise<void> {
  await ensureOidcBearerReady();
  const url = `${SNAPSHOTS_PATH}/${snapshotId}/mermaid/export.png${buildMermaidQuery(query)}`;
  const headers = new Headers();
  headers.set("Accept", "image/png, application/json");

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
    ?? buildInfraEvidenceMermaidPngFileName(snapshotId, query);
  const blob = await response.blob();
  await triggerBrowserBlobDownload(blob, fileName);
}

export async function downloadInfraEvidenceMermaidPng(
  snapshotId: string,
  query: InfraEvidenceMermaidRenderQuery,
  options: InfraEvidenceMermaidPngDownloadOptions = {},
): Promise<InfraEvidenceMermaidPngDownloadResult> {
  if (!isBrowser()) {
    throw new Error("downloadInfraEvidenceMermaidPng is only supported in the browser.");
  }

  try {
    await downloadInfraEvidenceMermaidPngFromServer(snapshotId, query);

    return { usedBrowserFallback: false };
  }
  catch (error: unknown) {
    const fallbackMermaidSource = options.fallbackMermaidSource?.trim() ?? "";

    if (fallbackMermaidSource.length === 0 || !isInfraEvidenceMermaidServerPngUnavailableError(error)) {
      throw error;
    }

    const fallbackSvgMarkup = options.fallbackSvgMarkup?.trim() ?? "";
    const dark = options.dark ?? false;

    const blob =
      fallbackSvgMarkup.length > 0
        ? await exportSanitizedMermaidSvgMarkupToPngBlob(fallbackSvgMarkup, { dark })
        : await exportMermaidSourceToPngBlob(fallbackMermaidSource, {
            dark,
            renderId: `infra-evidence-mermaid-export-${snapshotId}`,
          });
    await triggerBrowserBlobDownload(blob, buildInfraEvidenceMermaidPngFileName(snapshotId, query));

    return { usedBrowserFallback: true };
  }
}

export function formatInfraEvidenceMermaidApiError(error: unknown): string {
  const failure = toApiLoadFailure(error);
  const blockedReason = infraEvidenceMermaidMutationBlockedReason(failure);

  if (blockedReason !== null) {
    return blockedReason;
  }

  return formatInfraEvidenceSealedManifestAwareApiError(error);
}
