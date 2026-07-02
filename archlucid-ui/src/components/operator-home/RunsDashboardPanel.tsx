"use client";

import { RunsDashboardPanelClient, type RunsDashboardPanelClientProps } from "@/components/operator-home/RunsDashboardPanelClient";

export type RunsDashboardPanelProps = RunsDashboardPanelClientProps;

/** Thin client entry for the home runs dashboard (TB-564). */
export function RunsDashboardPanel(props: RunsDashboardPanelProps = {}) {
  return <RunsDashboardPanelClient hideHeading={props.hideHeading} initialModel={props.initialModel ?? null} />;
}
