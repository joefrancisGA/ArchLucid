import type { components } from "@/lib/openapi-schemas";

export type GlobalSearchFinding = components["schemas"]["GlobalSearchFindingResponse"];

export type GlobalSearchPolicyPack = components["schemas"]["GlobalSearchPolicyPackResponse"];

export type GlobalSearchRun = components["schemas"]["GlobalSearchRunResponse"];

type GlobalSearchResponseSchema = components["schemas"]["GlobalSearchResponse"];

export type GlobalSearchResponse = GlobalSearchResponseSchema & {
  findings?: GlobalSearchFinding[];
  policyPacks?: GlobalSearchPolicyPack[];
  runs?: GlobalSearchRun[];
};
