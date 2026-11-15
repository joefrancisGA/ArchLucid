import { apiPostJson } from "./http";
import { trimRequiredPathSegment } from "./api-boundary-normalization";

export type GeneratePolicyPackInput = {
  prompt: string;
};

export type GeneratePolicyPackResponse = {
  disclaimer: string;
  curatedRulesDocumentJson: string;
  validationWarnings?: string[];
  requiresHumanReview?: boolean;
};

/** POST /v1/governance/policy-pack/generate — AI-assisted full curated rules document (not persisted). */
export async function generatePolicyPackFromPrompt(
  input: GeneratePolicyPackInput,
): Promise<GeneratePolicyPackResponse> {
  const raw = await apiPostJson<unknown>("/v1/governance/policy-pack/generate", {
    prompt: trimRequiredPathSegment(input.prompt, "prompt"),
  });
  const row = raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
  const validationWarnings = Array.isArray(row.validationWarnings)
    ? row.validationWarnings.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : undefined;

  return {
    disclaimer: typeof row.disclaimer === "string" ? row.disclaimer : "",
    curatedRulesDocumentJson: typeof row.curatedRulesDocumentJson === "string" ? row.curatedRulesDocumentJson : "",
    ...(validationWarnings !== undefined && validationWarnings.length > 0 ? { validationWarnings } : {}),
    ...(row.requiresHumanReview === true ? { requiresHumanReview: true } : {}),
  };
}
