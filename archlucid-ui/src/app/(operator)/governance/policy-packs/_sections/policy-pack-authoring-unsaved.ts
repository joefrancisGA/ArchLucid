import { DEFAULT_CONTENT } from "./policy-packs-page-constants";

const DEFAULT_CREATE_NAME = "Baseline governance";
const DEFAULT_PACK_TYPE = "ProjectCustom";

export type PolicyPackAuthoringUnsavedInput = {
  readonly createJson: string;
  readonly name: string;
  readonly description: string;
  readonly packType: string;
  readonly publishJson: string;
  readonly publishBaselineJson: string | null;
  readonly selectedPackId: string;
};

export function policyPackCreateFormHasUnsavedEdits(
  input: Pick<PolicyPackAuthoringUnsavedInput, "createJson" | "name" | "description" | "packType">,
): boolean {
  return (
    input.createJson.trim() !== DEFAULT_CONTENT.trim()
    || input.name.trim() !== DEFAULT_CREATE_NAME
    || input.description.trim().length > 0
    || input.packType !== DEFAULT_PACK_TYPE
  );
}

export function policyPackPublishFormHasUnsavedEdits(
  input: Pick<PolicyPackAuthoringUnsavedInput, "publishJson" | "publishBaselineJson" | "selectedPackId">,
): boolean {
  if (input.selectedPackId.trim().length === 0) {
    return false;
  }

  const baseline = (input.publishBaselineJson ?? DEFAULT_CONTENT).trim();

  return input.publishJson.trim() !== baseline;
}

export function policyPackAuthoringHasUnsavedEdits(input: PolicyPackAuthoringUnsavedInput): boolean {
  return policyPackCreateFormHasUnsavedEdits(input) || policyPackPublishFormHasUnsavedEdits(input);
}
