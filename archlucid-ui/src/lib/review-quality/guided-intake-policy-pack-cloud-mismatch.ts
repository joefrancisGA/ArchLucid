import { CLOUD_TARGET_QUESTION_KEY } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL } from "@/lib/architecture/architecture-draft-structured-brief";
import { applyFocusedPilotModePolicyReferences } from "@/lib/focused-pilot-mode-policy-packs";
import { normalizeCloudProviderForMismatchCheck } from "@/lib/review-quality/policy-pack-cloud-mismatch-for-review";
import { evaluatePolicyPackCloudMismatch } from "@/lib/review-quality/review-intake-quality-gates";

export function deriveGuidedIntakePolicyReferences(
  focusedPilotModeEnabled: boolean,
  deeplinkPolicyPackId: string | null | undefined,
): readonly string[] {
  const refs = applyFocusedPilotModePolicyReferences([], focusedPilotModeEnabled);
  const packId = deeplinkPolicyPackId?.trim() ?? "";

  if (packId.length > 0 && !refs.includes(packId)) {
    return [...refs, packId];
  }

  return refs;
}

export function deriveGuidedIntakeCloudTargetForMismatch(
  answers: Readonly<Record<string, string>>,
): string {
  const cloudTargetAnswer = answers[CLOUD_TARGET_QUESTION_KEY]?.trim() ?? "";

  if (
    cloudTargetAnswer.length === 0
    || cloudTargetAnswer === ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL
  ) {
    return "none";
  }

  return normalizeCloudProviderForMismatchCheck(cloudTargetAnswer);
}

/** TB-2322 — guided intake parity with quick-start and detailed wizard gates. */
export function deriveGuidedIntakePolicyPackCloudMismatch(
  focusedPilotModeEnabled: boolean,
  deeplinkPolicyPackId: string | null | undefined,
  answers: Readonly<Record<string, string>>,
): string | null {
  const policyReferences = deriveGuidedIntakePolicyReferences(
    focusedPilotModeEnabled,
    deeplinkPolicyPackId,
  );
  const cloud = deriveGuidedIntakeCloudTargetForMismatch(answers);

  return evaluatePolicyPackCloudMismatch(cloud, policyReferences);
}
