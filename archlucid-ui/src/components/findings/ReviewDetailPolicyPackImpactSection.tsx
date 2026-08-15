"use client";

import { useEffect, useState } from "react";

import type { CompareEffectivePackAssignmentAtCommitRow } from "@/lib/compare-effective-governance-diff";
import { getArchitectureRequest } from "@/lib/api";
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
  readonly packAssignments?: readonly CompareEffectivePackAssignmentAtCommitRow[] | null;
};

/**
 * TB-2322 — surfaces policy-pack ↔ cloud-target mismatch on committed review detail (parity with intake wizard).
 */
export function ReviewDetailPolicyPackImpactSection(
  props: ReviewDetailPolicyPackImpactSectionProps,
): React.JSX.Element | null {
  const [cloudMismatchDetail, setCloudMismatchDetail] = useState<string | null>(null);

  useEffect(() => {
    const requestId = props.architectureRequestId?.trim() ?? "";

    if (requestId.length === 0) {
      setCloudMismatchDetail(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const request = await getArchitectureRequest(requestId);
        const mismatch = evaluatePolicyPackCloudMismatchForReview(
          request.cloudProvider,
          props.ruleSetId,
          props.ruleSetVersion,
          request.policyReferences,
          props.packAssignments,
        );

        if (!cancelled) {
          setCloudMismatchDetail(mismatch);
        }
      } catch {
        if (!cancelled) {
          setCloudMismatchDetail(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    props.architectureRequestId,
    props.ruleSetId,
    props.ruleSetVersion,
    props.packAssignments,
  ]);

  return (
    <ReviewDetailPolicyPackImpactCallout
      ruleSetId={props.ruleSetId}
      ruleSetVersion={props.ruleSetVersion}
      runId={props.runId}
      mappedFindingCount={props.mappedFindingCount}
      totalFindingCount={props.totalFindingCount}
      variant={props.variant}
      cloudMismatchDetail={cloudMismatchDetail}
    />
  );
}
