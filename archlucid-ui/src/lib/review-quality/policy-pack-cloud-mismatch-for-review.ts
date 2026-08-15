import type { CompareEffectivePackAssignmentAtCommitRow } from "@/lib/compare-effective-governance-diff";

import { evaluatePolicyPackCloudMismatch } from "./review-intake-quality-gates";

/** Maps authority `CloudProvider` enum values to intake mismatch tokens (`aws`, `gcp`, `none`). */
export function normalizeCloudProviderForMismatchCheck(cloudProvider: string | null | undefined): string {
  const raw = (cloudProvider ?? "None").trim();

  if (raw.length === 0) {
    return "none";
  }

  if (raw === "Aws") {
    return "aws";
  }

  if (raw === "Gcp") {
    return "gcp";
  }

  if (raw === "Azure") {
    return "azure";
  }

  return raw.toLowerCase();
}

export function collectPolicyReferencesForCloudMismatchCheck(
  ruleSetId: string,
  ruleSetVersion: string | null | undefined,
  requestPolicyReferences: readonly string[],
  packAssignments: readonly CompareEffectivePackAssignmentAtCommitRow[] | null | undefined,
): readonly string[] {
  const refs = new Set<string>();
  const trimmedRuleSetId = ruleSetId.trim();

  if (trimmedRuleSetId.length > 0) {
    refs.add(trimmedRuleSetId);

    const trimmedVersion = (ruleSetVersion ?? "").trim();

    if (trimmedVersion.length > 0) {
      refs.add(`${trimmedRuleSetId}@${trimmedVersion}`);
    }
  }

  for (const reference of requestPolicyReferences) {
    const trimmedReference = reference.trim();

    if (trimmedReference.length > 0) {
      refs.add(trimmedReference);
    }
  }

  for (const assignment of packAssignments ?? []) {
    const packId = assignment.policyPackId.trim();

    if (packId.length > 0) {
      refs.add(packId);
    }
  }

  return [...refs];
}

/** TB-2322 on committed review detail — same bar as intake wizard mismatch gate. */
export function evaluatePolicyPackCloudMismatchForReview(
  cloudProvider: string | null | undefined,
  ruleSetId: string,
  ruleSetVersion: string | null | undefined,
  requestPolicyReferences: readonly string[],
  packAssignments: readonly CompareEffectivePackAssignmentAtCommitRow[] | null | undefined,
): string | null {
  const policyReferences = collectPolicyReferencesForCloudMismatchCheck(
    ruleSetId,
    ruleSetVersion,
    requestPolicyReferences,
    packAssignments,
  );

  return evaluatePolicyPackCloudMismatch(
    normalizeCloudProviderForMismatchCheck(cloudProvider),
    policyReferences,
  );
}
