import type { LearningProfile } from "@/types/recommendation-learning";
import type { ReplayResponse } from "@/types/authority";
import { ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "./http";

export async function rebuildLearningProfile(): Promise<LearningProfile> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest("/v1/recommendation-learning/rebuild");
  const h = withCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, {
    method: "POST",
    headers: h,
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  return JSON.parse(text) as LearningProfile;
}

/** Replays an authority chain for a run using the specified mode (ReconstructOnly, RebuildManifest, RebuildArtifacts). */
export async function replayRun(runId: string, mode: string): Promise<ReplayResponse> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest("/v1/authority/replay");
  const h = withCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, {
    method: "POST",
    headers: h,
    cache: "no-store",
    body: JSON.stringify({ runId, mode }),
  });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  return JSON.parse(text) as ReplayResponse;
}
