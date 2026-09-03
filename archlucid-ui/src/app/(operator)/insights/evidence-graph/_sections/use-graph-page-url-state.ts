"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  resolveEvidenceTrailPresentationView,
  type EvidenceTrailPresentationView,
  type GraphMode,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { parseGraphScopeModeFromSearch } from "@/lib/insights/graph-scope-mode-url";
import { parseGraphNodeTypeFromSearch } from "@/lib/insights/graph-node-type-url";

export function useGraphPageUrlState(options: {
  setRunId: (runId: string) => void;
  setGraphLoadRequested: (requested: boolean) => void;
  setPresentationView: (view: EvidenceTrailPresentationView) => void;
  setMode: (mode: GraphMode) => void;
  setTypeFilter: (typeFilter: string) => void;
}): { urlRunId: string; urlGraphNodeId: string } {
  const { setRunId, setGraphLoadRequested, setPresentationView, setMode, setTypeFilter } = options;
  const searchParams = useSearchParams();
  const urlRunId = searchParams.get("runId")?.trim() ?? "";
  const urlGraphNodeId = searchParams.get("graphNodeId")?.trim() ?? "";
  const urlPresentation = searchParams.get("presentation");
  const urlGraphMode = searchParams.get("graphMode");
  const urlNodeType = searchParams.get("nodeType");

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

  useEffect(() => {
    setMode(parseGraphScopeModeFromSearch(urlGraphMode));
  }, [setMode, urlGraphMode]);

  useEffect(() => {
    setTypeFilter(parseGraphNodeTypeFromSearch(urlNodeType));
  }, [setTypeFilter, urlNodeType]);

  return { urlRunId, urlGraphNodeId };
}
