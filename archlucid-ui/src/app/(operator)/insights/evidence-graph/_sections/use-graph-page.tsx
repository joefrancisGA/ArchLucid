"use client";

import { useGraphPageControls } from "./use-graph-page-controls";
import { useGraphPageState } from "./use-graph-page-state";

export type UseGraphPageOptions = {
  readonly basePathname?: string;
  readonly pinnedArchitectureId?: string;
};

export function useGraphPage(options: UseGraphPageOptions = {}) {
  const state = useGraphPageState(options);
  const { savedViewsBar, controls, buyerGraphBody } = useGraphPageControls(state);

  return {
    ...state,
    buyerGraphBody,
    savedViewsBar,
    controls,
  };
}
