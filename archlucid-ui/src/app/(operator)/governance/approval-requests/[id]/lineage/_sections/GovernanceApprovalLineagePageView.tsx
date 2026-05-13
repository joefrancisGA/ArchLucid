"use client";

import Link from "next/link";

import { DemoUnavailableNotice } from "@/components/DemoUnavailableNotice";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";
import { OperatorEmptyState, OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { isApiNotFoundFailure } from "@/lib/api-load-failure";

import { GovernanceApprovalLineageDetailContent } from "./GovernanceApprovalLineageDetailContent";
import type { UseGovernanceApprovalLineagePageModel } from "./use-governance-approval-lineage-page";

type GovernanceApprovalLineagePageViewProps = {
  model: UseGovernanceApprovalLineagePageModel;
};

export function GovernanceApprovalLineagePageView({ model }: GovernanceApprovalLineagePageViewProps) {
  const { buyerPolishedShell, data, failure, load, loading, nextDemo } = model;

  if (failure !== null && isApiNotFoundFailure(failure)) {
    return <OperatorBrandedNotFound />;
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
              ? "Lineage detail is not available in this demo environment, or this approval id has no persisted lineage yet. Explore governance findings or a completed example review instead."
              : "Lineage detail is not available for this approval in the guided review experience yet, or the service returned no linkage. Explore governance findings or a completed example review instead."
          }
          learnMoreHref="/governance/findings"
          learnMoreLabel="Governance findings"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            Retry
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reviews?projectId=default">Reviews</Link>
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
    return (
      <OperatorEmptyState title="No data">
        <p className="text-sm">Lineage could not be loaded.</p>
      </OperatorEmptyState>
    );
  }

  return <GovernanceApprovalLineageDetailContent data={data} />;
}
