import { ApiV1Routes } from "@/lib/api-v1-routes";
import { isRecord } from "./api-boundary-normalization";

import { apiPostJson } from "./http";

export type PolicyPackContentValidationIssueKind = "Error" | "Warning";

export type PolicyPackContentValidationIssue = {
  readonly kind?: PolicyPackContentValidationIssueKind;
  readonly message?: string | null;
  readonly path?: string | null;
};

export type PolicyPackContentValidationSummary = {
  readonly complianceRuleIdCount?: number;
  readonly complianceRuleKeyCount?: number;
  readonly alertRuleIdCount?: number;
  readonly compositeAlertRuleIdCount?: number;
  readonly advisoryDefaultCount?: number;
  readonly metadataEntryCount?: number;
  readonly elicitationQuestionCount?: number;
};

export type PolicyPackContentValidationResponse = {
  readonly valid?: boolean;
  readonly summary?: PolicyPackContentValidationSummary;
  readonly issues?: readonly PolicyPackContentValidationIssue[];
};

/** POST /v1/policy-packs/validate — structural + rule-key validation without persisting a pack. */
export async function validatePolicyPackContentDocument(
  content: unknown,
): Promise<PolicyPackContentValidationResponse> {
  if (!isRecord(content)) {
    throw new Error("Policy pack content must be a JSON object.");
  }

  return apiPostJson<PolicyPackContentValidationResponse>(
    `/${ApiV1Routes.policyPacks}/validate`,
    content,
  );
}
