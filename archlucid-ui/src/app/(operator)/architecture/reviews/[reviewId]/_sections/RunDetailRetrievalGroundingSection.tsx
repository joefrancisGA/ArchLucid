"use client";

import { useEffect, useState } from "react";

import { RunRetrievalGroundingPanel } from "@/components/runs/RunRetrievalGroundingPanel";
import { useRunRetrievalGroundingQuery } from "@/hooks/use-run-retrieval-grounding-query";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { runRetrievalGroundingBlockedReason } from "@/lib/runs/run-retrieval-grounding-blocked-reason";

type RunDetailRetrievalGroundingSectionProps = {
  readonly runId: string;
  readonly showWhenFaithfulnessWarning?: boolean;
};

/** Collapsed retrieval-hit panel on run detail (TB-109). */
export function RunDetailRetrievalGroundingSection(props: RunDetailRetrievalGroundingSectionProps) {
  const { data: payload, isPending, isError, error } = useRunRetrievalGroundingQuery(props.runId);
  const failure: ApiLoadFailureState | null = isError ? toApiLoadFailure(error) : null;
  const blockedReason = runRetrievalGroundingBlockedReason(failure);

  if (isPending) {
    return null;
  }

  const rowCount = payload?.rows?.length ?? 0;

  if (rowCount === 0 && failure === null && props.showWhenFaithfulnessWarning !== true) {
    return null;
  }

  return (
    <RunRetrievalGroundingPanel
      payload={payload ?? null}
      failure={failure}
      blockedReason={blockedReason}
      sectionId="run-retrieval-grounding"
      title="Retrieval grounding"
    />
  );
}
