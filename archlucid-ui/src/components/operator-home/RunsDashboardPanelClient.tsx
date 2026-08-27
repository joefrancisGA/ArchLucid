"use client";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";

import { RunsDashboardPanelChrome } from "./RunsDashboardPanelChrome";
import { useRunsDashboardPanel } from "./use-runs-dashboard-panel";

export type RunsDashboardPanelClientProps = {
  /** Suppress the built-in section heading when a parent zone heading already labels this panel. */
  readonly hideHeading?: boolean;
  /** Server-loaded runs snapshot for first paint (TB-564). */
  readonly initialModel?: OperatorHomeRunsDashboardModel | null;
};

export function RunsDashboardPanelClient({
  hideHeading = false,
  initialModel = null,
}: RunsDashboardPanelClientProps = {}) {
  const model = useRunsDashboardPanel({ hideHeading, initialModel });

  return <RunsDashboardPanelChrome model={model} />;
}
