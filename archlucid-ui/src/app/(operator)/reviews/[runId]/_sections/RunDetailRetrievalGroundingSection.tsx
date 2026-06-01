"use client";

import { useEffect, useState } from "react";

import { RunRetrievalGroundingPanel } from "@/components/RunRetrievalGroundingPanel";
import { getRunRetrievalGrounding } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { RunRetrievalGroundingPayload } from "@/types/agent-forensics";

type RunDetailRetrievalGroundingSectionProps = {
  readonly runId: string;
  readonly showWhenFaithfulnessWarning?: boolean;
};

/** Collapsed retrieval-hit panel on run detail (TB-109). */
export function RunDetailRetrievalGroundingSection(props: RunDetailRetrievalGroundingSectionProps) {
  const [payload, setPayload] = useState<RunRetrievalGroundingPayload | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await getRunRetrievalGrounding(props.runId);

        if (!cancelled) {
          setPayload(response.data);
          setFailure(null);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setPayload(null);
          setFailure(toApiLoadFailure(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.runId]);

  if (loading) {
    return null;
  }

  const rowCount = payload?.rows?.length ?? 0;

  if (rowCount === 0 && failure === null && props.showWhenFaithfulnessWarning !== true) {
    return null;
  }

  return (
    <RunRetrievalGroundingPanel
      payload={payload}
      failure={failure}
      sectionId="run-retrieval-grounding"
      title="Retrieval grounding"
    />
  );
}
