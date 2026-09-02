"use client";

import { useEffect } from "react";
import { useReactFlow } from "reactflow";

import { isBuyerTrailPhiHeroNode } from "@/lib/graph-mapper";
import type { GraphNodeVm, GraphViewModel } from "@/types/graph";

export function pickHeroNodeId(graph: GraphViewModel, preferredId: string | undefined): GraphNodeVm | null {
  const trimmed = preferredId?.trim() ?? "";
  if (trimmed.length > 0) {
    const match = graph.nodes.find((n) => n.id === trimmed);
    if (match !== undefined) return match;
  }
  const phiHero = graph.nodes.find((n) => isBuyerTrailPhiHeroNode(n));
  if (phiHero !== undefined) return phiHero;
  const finding = graph.nodes.find((n) => n.type === "Finding");
  if (finding !== undefined) return finding;
  const manifest = graph.nodes.find((n) => n.type === "GoldenManifest");
  if (manifest !== undefined) return manifest;
  return graph.nodes[0] ?? null;
}

export function GraphBuyerZoom100Trigger({ trigger }: { trigger: number }) {
  const { getViewport, setViewport } = useReactFlow();
  useEffect(() => {
    if (trigger === 0) return;
    const current = getViewport();
    void setViewport({ x: current.x, y: current.y, zoom: 1 }, { duration: 200 });
  }, [getViewport, setViewport, trigger]);
  return null;
}

export function GraphBuyerFitViewTrigger({
  fitPadding,
  fitMaxZoom,
  trigger,
}: {
  fitPadding: number;
  fitMaxZoom: number;
  trigger: number;
}) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (trigger === 0) return;
    void fitView({ padding: fitPadding, maxZoom: fitMaxZoom, duration: 260 });
  }, [fitMaxZoom, fitPadding, fitView, trigger]);
  return null;
}

export function GraphFitViewSync({
  nodeCount,
  edgeCount,
  presentationKey,
  padding,
  maxZoom,
}: {
  nodeCount: number;
  edgeCount: number;
  presentationKey: string;
  padding: number;
  maxZoom: number;
}) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (nodeCount === 0) return;
    let canceled = false;
    const outer = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!canceled) void fitView({ padding, maxZoom, duration: 260 });
      });
    });
    return () => {
      canceled = true;
      window.cancelAnimationFrame(outer);
    };
  }, [nodeCount, edgeCount, presentationKey, padding, maxZoom, fitView]);
  return null;
}
