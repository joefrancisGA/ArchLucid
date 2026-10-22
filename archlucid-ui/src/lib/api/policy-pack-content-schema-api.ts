import { ApiV1Routes } from "@/lib/api-v1-routes";
import { apiGet } from "./http";

export type PolicyPackContentDocumentJsonSchemaResponse = {
  readonly schema: Record<string, unknown>;
};

/** GET /v1/governance/policy-pack-content-schema — PolicyPackContentDocument JSON Schema for editor linting. */
export async function getPolicyPackContentDocumentJsonSchema(): Promise<PolicyPackContentDocumentJsonSchemaResponse> {
  return apiGet<PolicyPackContentDocumentJsonSchemaResponse>(
    `/${ApiV1Routes.governance}/policy-pack-content-schema`,
  );
}
