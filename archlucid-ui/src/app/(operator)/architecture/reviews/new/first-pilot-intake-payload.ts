import {
  proofScopeToRequiredCapabilities,
  type QuickReviewProofScopeId,
} from "@/components/usability/QuickReviewProofScopeField";
import { type CreateArchitectureRunRequestPayload } from "@/lib/api";
import { applyFocusedPilotModePolicyReferences } from "@/lib/focused-pilot-mode-policy-packs";
import { normalizeFirstPilotReviewTitle } from "@/lib/first-pilot-intake";
import { getOrCreateWizardRequestId } from "@/lib/wizard-idempotency-key";

const V1_DEFAULT_CLOUD_PROVIDER: CreateArchitectureRunRequestPayload["cloudProvider"] = "None";

/**
 * First-run intake sends every proof dimension. The former operator-facing selector was removed because
 * no pipeline stage branches on these capability tokens, so narrowing them changed nothing a buyer could see.
 */
const DEFAULT_PROOF_SCOPE: QuickReviewProofScopeId[] = ["cost", "compliance", "topology"];
export const FIRST_PILOT_REQUIRED_CAPABILITIES: string[] = proofScopeToRequiredCapabilities(DEFAULT_PROOF_SCOPE);

export function buildFirstPilotPayload(
  title: string,
  brief: string,
  requiredCapabilities: string[],
  focusedPilotModeEnabled: boolean,
): CreateArchitectureRunRequestPayload {
  return {
    requestId: getOrCreateWizardRequestId(),
    description: brief.trim(),
    systemName: normalizeFirstPilotReviewTitle(title),
    environment: "staging",
    cloudProvider: V1_DEFAULT_CLOUD_PROVIDER,
    constraints: [],
    requiredCapabilities,
    assumptions: [],
    policyReferences: applyFocusedPilotModePolicyReferences([], focusedPilotModeEnabled),
  };
}
