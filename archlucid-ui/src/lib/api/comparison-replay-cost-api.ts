import type { components } from "@/lib/api-types.generated";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type ComparisonReplayCostEstimateResponse = components["schemas"]["ComparisonReplayCostEstimateResponse"];

/** Cost estimate surfaced before initiating architecture comparison replay (warn-only UX). */

export async function fetchArchitectureComparisonReplayCostEstimate(
  comparisonRecordId: string,
  query?: Readonly<{ replayMode?: string; format?: string; persistReplay?: boolean }>,
): Promise<ComparisonReplayCostEstimateResponse> {
  const id = comparisonRecordId.trim();

  if (id.length === 0) {
    throw new Error("comparisonRecordId is required.");
  }

  const qp = new URLSearchParams();

  if (query?.replayMode != null && query.replayMode.trim().length > 0) {
    qp.set("replayMode", query.replayMode.trim());
  }

  if (query?.format != null && query.format.trim().length > 0) {
    qp.set("format", query.format.trim());
  }

  if (query?.persistReplay === true || query?.persistReplay === false) {
    qp.set("persistReplay", String(query.persistReplay));
  }

  const suffix = qp.toString().length > 0 ? `?${qp}` : "";

  const res = await fetch(
    `/api/proxy/v1/architecture/comparisons/${encodeURIComponent(id)}/replay/cost-estimate${suffix}`,
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
  );
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text.length > 0 ? text : `HTTP ${String(res.status)}`);
  }

  const body = JSON.parse(text) as ComparisonReplayCostEstimateResponse;

  return body;
}
