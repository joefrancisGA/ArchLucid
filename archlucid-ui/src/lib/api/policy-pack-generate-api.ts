import { apiPostJson } from "./http";

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
  return apiPostJson<GeneratePolicyPackResponse>("/v1/governance/policy-pack/generate", {
    prompt: input.prompt,
  });
}
