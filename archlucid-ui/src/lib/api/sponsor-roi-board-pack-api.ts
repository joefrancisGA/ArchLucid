import { ApiV1Routes } from "@/lib/api-v1-routes";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/** Downloads sponsor ROI board pack from GET /v1/roi/sponsor-report/board-pack. */
export async function downloadSponsorRoiBoardPack(options: {
  format: "md" | "pdf";
  generateNarrative?: boolean;
}): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadSponsorRoiBoardPack is only supported in the browser.");
  }

  const params = new URLSearchParams({ format: options.format });

  if (options.generateNarrative === true) {
    params.set("generateNarrative", "true");
  }

  const path = `/api/proxy/${ApiV1Routes.roiSponsorReportBoardPack}?${params.toString()}`;
  const accept = options.format === "pdf" ? "application/pdf" : "text/markdown";
  const scoped = mergeRegistrationScopeForProxy({ headers: { Accept: accept } });
  const { headers: correlatedHeaders, correlationId } = applyCorrelationHeaders(new Headers(scoped.headers));
  const response = await fetch(path, { ...scoped, headers: correlatedHeaders });

  if (!response.ok) {
    const text = await response.text();
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, text, correlationId));
    throw new Error(formatExportSealedManifestAwareApiError(failure));
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    options.format === "pdf" ? "sponsor-roi-board-pack.pdf" : "sponsor-roi-board-pack.md";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatSponsorRoiBoardPackApiError(error: unknown): string {
  return formatExportSealedManifestAwareApiError(error);
}
