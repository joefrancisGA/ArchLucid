"use client";

import Link from "next/link";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { DemoUnavailableNotice } from "@/components/DemoUnavailableNotice";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorBrandedRouteLoadFailure } from "@/components/operator/OperatorBrandedRouteLoadFailure";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { resolveApiLoadFailurePresentation } from "@/lib/api-load-failure";
import { GOVERNANCE_APPROVAL_LINEAGE_NO_DATA_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

import { GovernanceApprovalLineageDetailContent } from "./GovernanceApprovalLineageDetailContent";
import { GovernanceApprovalLineageNextRequestFooterClient } from "./GovernanceApprovalLineageNextRequestFooterClient";
import { GovernanceApprovalQueueNextReviewFooterClient } from "@/app/(operator)/governance/_sections/GovernanceApprovalQueueNextReviewFooterClient";
import type { UseGovernanceApprovalLineagePageModel } from "./use-governance-approval-lineage-page";

type GovernanceApprovalLineagePageViewProps = {
  model: UseGovernanceApprovalLineagePageModel;
};

export function GovernanceApprovalLineagePageView({ model }: GovernanceApprovalLineagePageViewProps) {
  const { buyerPolishedShell, data, failure, load, loading, nextDemo } = model;

  if (failure !== null && resolveApiLoadFailurePresentation(failure) !== "error") {
    return <OperatorBrandedRouteLoadFailure failure={failure} retryLabel="Retry loading lineage" />;
  }

  if (loading) {
    if (nextDemo || buyerPolishedShell) {
      return (
        <OperatorLoadingNotice>Loading approval lineage…</OperatorLoadingNotice>
      );
    }

    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading lineage">
        <div className="h-8 w-64 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-40 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
      </div>
    );
  }

  const lineageMissing = failure !== null || data === null;

  if ((nextDemo || buyerPolishedShell) && lineageMissing) {
    return (
      <div className="space-y-4">
        <DemoUnavailableNotice
          title="Approval lineage"
          description={
            nextDemo
              ? "Lineage detail is not available in this demo environment, or this approval id has no persisted lineage yet. Explore the findings queue or a completed sample review instead."
              : "Lineage detail is not available for this approval in the guided review experience yet, or the service returned no linkage. Explore the findings queue or a completed sample review instead."
          }
          learnMoreHref="/governance/findings"
          learnMoreLabel="Findings"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            Retry
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/architecture/reviews">Reviews</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (failure !== null) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            Retry
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/governance/findings">Findings</Link>
          </Button>
        </div>
        <OperatorApiProblem
          problem={failure.problem}
          fallbackMessage={failure.message}
          correlationId={failure.correlationId}
        />
      </div>
    );
  }

  if (!data) {
    return <EnterpriseCompactEmptyState {...GOVERNANCE_APPROVAL_LINEAGE_NO_DATA_COMPACT} />;
  }

  return (
    <>
      <GovernanceApprovalLineageDetailContent data={data} />
      <GovernanceApprovalLineageNextRequestFooterClient
        runId={data.run?.runId ?? data.approvalRequest.runId}
        currentApprovalRequestId={model.approvalRequestId}
      />
      <GovernanceApprovalQueueNextReviewFooterClient
        runId={data.run?.runId ?? data.approvalRequest.runId}
      />
    </>
  );
}
