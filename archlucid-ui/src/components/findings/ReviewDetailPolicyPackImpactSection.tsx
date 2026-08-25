"use client";

import { useMemo } from "react";

import type { CompareEffectiveGovernanceAtCommitSnapshot } from "@/lib/compare-effective-governance-diff";
import { useArchitectureRequestQuery } from "@/hooks/use-architecture-request-query";
import { evaluatePolicyPackCloudMismatchForReview } from "@/lib/review-quality/policy-pack-cloud-mismatch-for-review";

import {
  ReviewDetailPolicyPackImpactCallout,
  type ReviewDetailPolicyPackImpactCalloutProps,
} from "./ReviewDetailPolicyPackImpactCallout";

export type ReviewDetailPolicyPackImpactSectionProps = Omit<
  ReviewDetailPolicyPackImpactCalloutProps,
  "cloudMismatchDetail"
> & {
  readonly architectureRequestId?: string | null;
  /** @deprecated Prefer effectiveGovernanceAtCommit; retained for deferred chunk callers. */
  readonly packAssignments?: CompareEffectiveGovernanceAtCommitSnapshot["packAssignments"] | null;
};

/**
 * TB-2322 — surfaces policy-pack ↔ cloud-target mismatch on committed review detail (parity with intake wizard).
 */
export function ReviewDetailPolicyPackImpactSection(
  props: ReviewDetailPolicyPackImpactSectionProps,
): React.JSX.Element | null {
  const requestId = props.architectureRequestId?.trim() ?? "";
  const architectureRequestQuery = useArchitectureRequestQuery(requestId, {
    enabled: requestId.length > 0,
  });

  const cloudMismatchDetail = useMemo(() => {
    if (requestId.length === 0 || architectureRequestQuery.data === undefined) {
      return null;
    }

    return evaluatePolicyPackCloudMismatchForReview(
      architectureRequestQuery.data.cloudProvider,
      props.ruleSetId,
      props.ruleSetVersion,
      architectureRequestQuery.data.policyReferences,
      props.effectiveGovernanceAtCommit?.packAssignments ?? props.packAssignments,
    );
  }, [
    architectureRequestQuery.data,
    props.effectiveGovernanceAtCommit?.packAssignments,
    props.packAssignments,
    props.ruleSetId,
    props.ruleSetVersion,
    requestId.length,
  ]);

  return (
    <ReviewDetailPolicyPackImpactCallout
      ruleSetId={props.ruleSetId}
      ruleSetVersion={props.ruleSetVersion}
      runId={props.runId}
      mappedFindingCount={props.mappedFindingCount}
      totalFindingCount={props.totalFindingCount}
      effectiveGovernanceAtCommit={props.effectiveGovernanceAtCommit}
      variant={props.variant}
      cloudMismatchDetail={cloudMismatchDetail}
    />
  );
}
