"use client";

import { useGraphPageControls } from "./use-graph-page-controls";
import { useGraphPageState } from "./use-graph-page-state";

export function useGraphPage() {
  const state = useGraphPageState();
  const { savedViewsBar, controls, buyerGraphBody } = useGraphPageControls(state);

  return {
    ...state,
    buyerGraphBody,
    savedViewsBar,
    controls,
  };
}
