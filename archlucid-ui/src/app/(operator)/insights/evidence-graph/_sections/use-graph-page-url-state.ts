"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  resolveEvidenceTrailPresentationView,
  type EvidenceTrailPresentationView,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";

export function useGraphPageUrlState(options: {
  setRunId: (runId: string) => void;
  setGraphLoadRequested: (requested: boolean) => void;
  setPresentationView: (view: EvidenceTrailPresentationView) => void;
}): { urlRunId: string; urlGraphNodeId: string } {
  const { setRunId, setGraphLoadRequested, setPresentationView } = options;
  const searchParams = useSearchParams();
  const urlRunId = searchParams.get("runId")?.trim() ?? "";
  const urlGraphNodeId = searchParams.get("graphNodeId")?.trim() ?? "";
  const urlPresentation = searchParams.get("presentation");

  useEffect(() => {
    if (urlRunId.length === 0) return;
    setRunId(urlRunId);
    setGraphLoadRequested(true);
  }, [urlRunId, setRunId, setGraphLoadRequested]);

  useEffect(() => {
    setPresentationView(
      resolveEvidenceTrailPresentationView(urlPresentation, isBuyerPolishedOperatorShellEnv()),
    );
  }, [urlPresentation, setPresentationView]);

  return { urlRunId, urlGraphNodeId };
}
