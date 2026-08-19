import { apiPostJson } from "./http";

export type HolisticCriticInput = {
  focus?: string;
};

export type HolisticCriticResponse = {
  disclaimer: string;
  critiqueMarkdown: string;
};

/** POST /v1/explain/runs/{runId}/holistic-critic — unstructured architecture critique (not persisted). */
export async function generateHolisticCritique(
  runId: string,
  input: HolisticCriticInput = {},
): Promise<HolisticCriticResponse> {
  return apiPostJson<HolisticCriticResponse>(
    `/v1/explain/runs/${encodeURIComponent(runId)}/holistic-critic`,
    input,
  );
}
