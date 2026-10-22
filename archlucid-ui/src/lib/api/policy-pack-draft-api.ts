import { apiPostJson } from "./http";

export type DraftPolicyPackInput = {
  freeTextIntent: string;
};

export type DraftPolicyPackRuleResponse = {
  disclaimer: string;
  draftRuleJson: string;
};

/** POST /v1/governance/policy-pack/draft — AI-assisted curated rule JSON (not persisted). */
export async function draftPolicyPackRule(
  input: DraftPolicyPackInput,
): Promise<DraftPolicyPackRuleResponse> {
  return apiPostJson<DraftPolicyPackRuleResponse>("/v1/governance/policy-pack/draft", input);
}
