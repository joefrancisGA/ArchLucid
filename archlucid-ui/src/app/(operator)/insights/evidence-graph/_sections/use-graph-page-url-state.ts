"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  resolveEvidenceTrailPresentationView,
  type EvidenceTrailPresentationView,
  type GraphMode,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { parseGraphScopeModeFromSearch } from "@/lib/insights/graph-scope-mode-url";
import { parseGraphNodeTypeFromSearch } from "@/lib/insights/graph-node-type-url";
import { parseGraphNeighborhoodDepthFromSearch } from "@/lib/insights/graph-neighborhood-depth-url";
import {
  parseGraphDecisionIdFromSearch,
  parseGraphNodeIdFromSearch,
} from "@/lib/insights/graph-node-decision-id-url";

export function useGraphPageUrlState(options: {
  setRunId: (runId: string) => void;
  setGraphLoadRequested: (requested: boolean) => void;
  setPresentationView: (view: EvidenceTrailPresentationView) => void;
  setMode: (mode: GraphMode) => void;
  setTypeFilter: (typeFilter: string) => void;
  setDepth: (depth: number) => void;
  setNodeId: (nodeId: string) => void;
  setDecisionId: (decisionId: string) => void;
}): { urlRunId: string; urlGraphNodeId: string } {
  const { setRunId, setGraphLoadRequested, setPresentationView, setMode, setTypeFilter, setDepth, setNodeId, setDecisionId } = options;
  const productionEvalChrome = useProductionEvalChrome();
  const searchParams = useSearchParams();
  const urlRunId = searchParams.get("runId")?.trim() ?? "";
  const urlGraphNodeId = searchParams.get("graphNodeId")?.trim() ?? "";
  const urlPresentation = searchParams.get("presentation");
  const urlGraphMode = searchParams.get("graphMode");
  const urlNodeType = searchParams.get("nodeType");
  const urlDepth = searchParams.get("depth");
  const urlNodeId = searchParams.get("nodeId");
  const urlDecisionId = searchParams.get("decisionId");

  useEffect(() => {
    if (urlRunId.length === 0) return;
    setRunId(urlRunId);
    setGraphLoadRequested(true);
  }, [urlRunId, setRunId, setGraphLoadRequested]);

  useEffect(() => {
    setPresentationView(resolveEvidenceTrailPresentationView(urlPresentation, productionEvalChrome));
  }, [productionEvalChrome, urlPresentation, setPresentationView]);

  useEffect(() => {
    setMode(parseGraphScopeModeFromSearch(urlGraphMode));
  }, [setMode, urlGraphMode]);

  useEffect(() => {
    setTypeFilter(parseGraphNodeTypeFromSearch(urlNodeType));
  }, [setTypeFilter, urlNodeType]);

  useEffect(() => {
    setDepth(parseGraphNeighborhoodDepthFromSearch(urlDepth));
  }, [setDepth, urlDepth]);

  useEffect(() => {
    setNodeId(parseGraphNodeIdFromSearch(urlNodeId));
  }, [setNodeId, urlNodeId]);

  useEffect(() => {
    setDecisionId(parseGraphDecisionIdFromSearch(urlDecisionId));
  }, [setDecisionId, urlDecisionId]);

  return { urlRunId, urlGraphNodeId };
}
