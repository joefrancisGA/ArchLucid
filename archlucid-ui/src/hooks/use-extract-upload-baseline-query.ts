"use client";

import { ApiV1Routes } from "@/lib/api-v1-routes";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { extractorScriptCdnUrl } from "@/lib/extractor-script-url";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { tryParseJsonResponseText } from "@/lib/parse-json-response-text";

export { extractorScriptCdnUrl };

const EXTRACTOR_SCRIPT_VERSION_PATTERN = /\$scriptVersion\s*=\s*"([^"]+)"/;

export type ExtractUploadBaselineSnapshot = {
  readonly hasBaselineArtifacts: boolean | null;
  readonly extractorScriptVersion: string | null;
  readonly extractorUpdateBanner: string | null;
};

type WorkspaceBaselineArtifactsPayload = {
  hasBaselineArtifacts?: unknown;
  extractorScriptVersion?: string | null;
};

async function fetchExtractUploadBaselineSnapshot(scriptUrl: string): Promise<ExtractUploadBaselineSnapshot> {
  const [baselineResponse, scriptResponse] = await Promise.all([
    fetch(
      `/api/proxy/${ApiV1Routes.tenantWorkspaceBaselineArtifacts}`,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
    ),
    fetch(scriptUrl, { cache: "no-store" }),
  ]);

  let baseline: WorkspaceBaselineArtifactsPayload | null = null;

  if (baselineResponse.ok) {
    baseline = tryParseJsonResponseText<WorkspaceBaselineArtifactsPayload>(await baselineResponse.text());
  }

  const hasBaselineArtifacts =
    baseline === null ? null : baseline.hasBaselineArtifacts === true;
  const extractorScriptVersion = baseline?.extractorScriptVersion?.trim() || null;

  if (!scriptResponse.ok || baseline === null) {
    return {
      hasBaselineArtifacts,
      extractorScriptVersion,
      extractorUpdateBanner: null,
    };
  }

  const scriptText = await scriptResponse.text();
  const match = EXTRACTOR_SCRIPT_VERSION_PATTERN.exec(scriptText);
  const latestVersion = match?.[1]?.trim();

  if (!latestVersion || !baseline.extractorScriptVersion) {
    return {
      hasBaselineArtifacts,
      extractorScriptVersion,
      extractorUpdateBanner: null,
    };
  }

  if (baseline.extractorScriptVersion !== latestVersion) {
    return {
      hasBaselineArtifacts,
      extractorScriptVersion,
      extractorUpdateBanner: `Your last uploaded ZIP used extractor script v${baseline.extractorScriptVersion}. v${latestVersion} is available — download the updated script for improved coverage.`,
    };
  }

  return {
    hasBaselineArtifacts,
    extractorScriptVersion,
    extractorUpdateBanner: null,
  };
}

export function useExtractUploadBaselineQuery(productLine: ProductLineId) {
  const scriptUrl = extractorScriptCdnUrl(productLine);

  return createOperatorQueryHook<ExtractUploadBaselineSnapshot>({
    queryKey: [...operatorQueryKeys.extractUploadBaselineArtifacts, productLine],
    queryFn: () => fetchExtractUploadBaselineSnapshot(scriptUrl),
  });
}
